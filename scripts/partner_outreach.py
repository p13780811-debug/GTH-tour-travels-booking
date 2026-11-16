#!/usr/bin/env python3
"""GTH PRO invitation runner: permission-only CSV, fail-closed SMTP, SQLite send ledger."""
from __future__ import annotations
import argparse,csv,datetime as dt,os,re,smtplib,sqlite3,ssl,sys,time
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import urlparse

EMAIL=re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$")
REQUIRED={"organization","email","country","state","district","source_url","permission","permission_source"}
INVITE="https://www.gthproglobal.com/real-estate/post-property"
MAX_PER_RUN=10

def safe(text,size=200):
    value=(text or "").strip()
    if not value or len(value)>size or any(ord(c)<32 or c in "<>\r\n" for c in value): raise ValueError("Invalid text field")
    return value

def valid_url(raw):
    url=urlparse(safe(raw,2048))
    if url.scheme!="https" or not url.hostname or url.username or url.password or url.hostname in ("localhost","127.0.0.1"):
        raise ValueError("Public HTTPS source URL required")
    return url.geturl()

def lead(row):
    organization=safe(row.get("organization",""),160)
    email=safe(row.get("email",""),254).lower()
    if not EMAIL.fullmatch(email): raise ValueError("Invalid email")
    if row.get("permission","").strip().lower()!="yes": raise ValueError("Recipient permission not documented")
    return dict(organization=organization,email=email,country=safe(row.get("country",""),80),state=safe(row.get("state",""),80),district=safe(row.get("district",""),80),source_url=valid_url(row.get("source_url","")),permission_source=safe(row.get("permission_source",""),500))

def connection(path):
    path.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(path,timeout=30)
    db.execute("PRAGMA busy_timeout=30000")
    db.execute("CREATE TABLE IF NOT EXISTS invitations (email TEXT PRIMARY KEY, organization TEXT NOT NULL, status TEXT NOT NULL, attempted_at TEXT NOT NULL, source_url TEXT NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS suppression (email TEXT PRIMARY KEY, reason TEXT NOT NULL)")
    db.commit()
    return db

def import_suppression(db,path):
    if not path:return
    with path.open(newline="",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or "email" not in reader.fieldnames: raise ValueError("Suppression CSV requires email")
        for row in reader:
            email=(row.get("email") or "").strip().lower()
            if EMAIL.fullmatch(email):db.execute("INSERT OR IGNORE INTO suppression VALUES (?,?)",(email,"opt-out"))
        db.commit()

def message(row,sender):
    msg=EmailMessage()
    msg["From"]=sender;msg["To"]=row["email"]
    msg["Subject"]="GTH PRO | Optional free property portfolio listing invitation"
    msg["List-Unsubscribe"]=f"<mailto:{sender}?subject=unsubscribe>"
    msg.set_content(f"""Dear {row['organization']} Team,

Greetings from GTH PRO – Global Technical Hub, an initiative of Etios Profession.

You may be interested in exploring free Real Estate submissions for developers, promoters and authorized agencies. The portal supports guided property description drafts and review-first Excel, CSV and selectable-text PDF portfolio imports (up to 100 property records per batch). Nothing is automatically published and no buyer leads are guaranteed.

Property submission: {INVITE}

This is an optional invitation. If you prefer no future GTH PRO partnership invitations, reply 'unsubscribe'.

Regards,
GTH PRO | Global Technical Hub
Etios Profession
https://www.gthproglobal.com
""")
    return msg

def load(path):
    with path.open(newline="",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):raise ValueError("Missing required CSV columns")
        rows=[]
        for number,row in enumerate(reader,2):
            try:rows.append(lead(row))
            except ValueError as exc:print(f"SKIP CSV row {number}: {exc}",file=sys.stderr)
        return rows

def dispatch(db,rows,*,send,limit,pause,smtp_factory=smtplib.SMTP):
    if not 1<=limit<=MAX_PER_RUN:raise ValueError("Maximum ten sends per run")
    seen=set();eligible=[]
    for row in rows:
        email=row["email"]
        if email in seen:continue
        seen.add(email)
        if db.execute("SELECT 1 FROM suppression WHERE email=?",(email,)).fetchone():continue
        if db.execute("SELECT 1 FROM invitations WHERE email=?",(email,)).fetchone():continue
        eligible.append(row)
    batch=eligible[:limit]
    if not send:return {"eligible":len(eligible),"preview":len(batch),"sent":0,"mode":"dry-run"}
    if os.environ.get("GTH_OUTREACH_ENABLED")!="true":raise RuntimeError("Sending disabled")
    host=os.environ["GTH_SMTP_HOST"];port=int(os.environ.get("GTH_SMTP_PORT","587"))
    user=os.environ["GTH_SMTP_USERNAME"];password=os.environ["GTH_SMTP_PASSWORD"]
    sender=os.environ.get("GTH_FROM_EMAIL",user)
    if not EMAIL.fullmatch(sender) or port!=587:raise ValueError("Valid sender and TLS port 587 required")
    sent=0
    if not batch:return {"eligible":len(eligible),"preview":0,"sent":0,"mode":"send"}
    with smtp_factory(host,port,timeout=20) as smtp:
        smtp.ehlo();smtp.starttls(context=ssl.create_default_context());smtp.ehlo();smtp.login(user,password)
        for index,row in enumerate(batch):
            db.execute("INSERT INTO invitations VALUES (?,?,?,?,?)",(row["email"],row["organization"],"attempted",dt.datetime.now(dt.timezone.utc).isoformat(),row["source_url"]))
            db.commit()
            try:smtp.send_message(message(row,sender))
            except (smtplib.SMTPException,OSError) as exc:
                db.execute("UPDATE invitations SET status='unknown' WHERE email=?",(row["email"],));db.commit()
                raise RuntimeError("SMTP failure: outcome unknown; manual check required") from exc
            db.execute("UPDATE invitations SET status='accepted' WHERE email=?",(row["email"],));db.commit()
            sent+=1
            if index<len(batch)-1 and pause>0:time.sleep(pause)
    return {"eligible":len(eligible),"preview":len(batch),"sent":sent,"mode":"send"}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--contacts",required=True,type=Path)
    p.add_argument("--ledger",type=Path,default=Path("private/partner-outreach.sqlite3"))
    p.add_argument("--suppression",type=Path)
    p.add_argument("--send",action="store_true")
    p.add_argument("--limit",type=int,default=5)
    p.add_argument("--pause",type=float,default=30)
    a=p.parse_args()
    try:
        db=connection(a.ledger);import_suppression(db,a.suppression)
        print(dispatch(db,load(a.contacts),send=a.send,limit=a.limit,pause=a.pause))
        return 0
    except (ValueError,RuntimeError,OSError,KeyError,sqlite3.Error) as exc:
        print(f"ERROR: {exc}",file=sys.stderr);return 1

if __name__=="__main__":raise SystemExit(main())
