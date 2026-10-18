"""Private, transactional checkpoints containing normalized public fields only."""
from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path

from .models import IngestionError, Project, canonical_name


class Checkpoint:
    def __init__(self, directory: Path, fingerprint: str, target_project: str):
        self.directory, self.db, self.lock = directory, None, None
        if any(p.is_symlink() for p in (directory, *directory.parents)):
            raise IngestionError("Checkpoint directories cannot contain symlinks")
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(directory, 0o700)
        path = directory / "endpoint.sqlite3"
        lock_path = directory / "endpoint.lock"
        if any(p.is_symlink() for p in (path, lock_path, directory / "endpoint.sqlite3-journal")):
            raise IngestionError("Checkpoint symlinks are forbidden")
        try:
            self.lock = open(lock_path, "a+b")
            os.chmod(lock_path, 0o600)
            if os.name == "nt":
                import msvcrt
                self.lock.seek(0); self.lock.write(b"0"); self.lock.flush(); self.lock.seek(0)
                msvcrt.locking(self.lock.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.db = sqlite3.connect(path)
            os.chmod(path, 0o600)
            self.db.execute("pragma synchronous=FULL")
            self.db.executescript("""
              create table if not exists config (name text primary key, value text not null);
              create table if not exists attempts (project_id integer primary key, outcome text not null);
              create table if not exists projects (rera_id text primary key, payload text not null, acknowledged integer not null default 0);
            """)
            for name, value in (("source_scope", fingerprint), ("target_project", target_project)):
                prior = self.db.execute("select value from config where name=?", (name,)).fetchone()
                if prior and prior[0] != value:
                    raise IngestionError("Checkpoint belongs to another source selection or database; use a separate run directory")
                self.db.execute("insert or ignore into config values (?,?)", (name, value))
            self.db.commit()
        except Exception:
            self.close()
            raise IngestionError("Checkpoint unavailable, incompatible or already in use") from None

    def attempted(self, project_id):
        return self.db.execute("select 1 from attempts where project_id=?", (project_id,)).fetchone() is not None

    def save(self, project_id, outcome, project=None):
        with self.db:
            if project:
                existing = self.db.execute("select payload from projects where rera_id=?", (project.rera_id,)).fetchone()
                if existing:
                    prior = Project.model_validate_json(existing[0])
                    if (canonical_name(prior.project_name), prior.district) != (canonical_name(project.project_name), project.district):
                        raise IngestionError("Conflicting duplicate RERA identity; source review required")
                else:
                    self.db.execute("insert into projects (rera_id,payload) values (?,?)", (project.rera_id, project.model_dump_json()))
            self.db.execute("insert into attempts values (?,?)", (project_id, outcome))

    def projects(self, pending_only=False, limit=5000):
        where = "where acknowledged=0" if pending_only else ""
        return [Project.model_validate_json(row[0]) for row in self.db.execute(
            f"select payload from projects {where} order by rowid limit ?", (limit,))]

    def acknowledge(self, projects):
        with self.db:
            self.db.executemany("update projects set acknowledged=1 where rera_id=?", [(p.rera_id,) for p in projects])

    def counts(self):
        return {"cached_target_projects": self.db.execute("select count(*) from projects").fetchone()[0],
                "acknowledged_projects": self.db.execute("select count(*) from projects where acknowledged=1").fetchone()[0],
                "completed_project_ids": self.db.execute("select count(*) from attempts").fetchone()[0]}

    def close(self):
        if self.db:
            self.db.close(); self.db = None
        if self.lock:
            self.lock.close(); self.lock = None
