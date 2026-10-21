import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHotelBookingSearch, hotelWhiteLabelUrl, hotelBookingParams, hotelWidgetSearchParams,
  normalizeHotelOccupancies, HOTEL_BOOKING_ORIGIN} from '../src/lib/travel/hotel-whitelabel.ts';
const now = new Date('2026-10-21T12:00:00Z');
const occupancy = [{adults:2,children:[0,8],rooms:2}];
const query = (overrides={}) => new URLSearchParams({
  placeId:'ChIJwe1EZjDG5zsRaYxkjY_tpF0',checkin:'2026-10-22',checkout:'2026-10-25',
  occupancies:btoa(JSON.stringify(occupancy)),currency:'INR',...overrides,
});
test('supplier handoff keeps exact hotel, dates, currency, rooms and child ages',()=>{
 const search=parseHotelBookingSearch(query({hotelId:'lp33bad'}),now);
 assert.ok(search);
 const url=new URL(hotelWhiteLabelUrl(search));
 assert.equal(url.origin,HOTEL_BOOKING_ORIGIN);
 assert.equal(url.pathname,'/hotels/lp33bad');
 assert.equal(url.searchParams.get('checkin'),'2026-10-22');
 assert.equal(url.searchParams.get('checkout'),'2026-10-25');
 assert.equal(url.searchParams.get('currency'),'INR');
 assert.equal(url.searchParams.get('language'),'en');
 assert.deepEqual(JSON.parse(atob(url.searchParams.get('occupancies'))),occupancy);
 assert.deepEqual(parseHotelBookingSearch(hotelBookingParams(search),now),search);
});
test('worldwide destination search never substitutes a guessed supplier hotel ID',()=>{
 const search=parseHotelBookingSearch(query(),now);
 assert.equal(new URL(hotelWhiteLabelUrl(search)).pathname,'/hotels');
 assert.equal(search.hotelId,undefined);
});
test('expired, impossible, reversed, excessive and missing dates fail closed',()=>{
 for(const changes of [
  {checkin:'2026-10-20'}, {checkin:'2026-02-30'}, {checkin:'2026-10-25'},
  {checkout:'2026-10-21'}, {checkout:'2027-03-01'}, {checkin:''}, {checkout:'2026-13-02'},
  {checkin:'2029-01-01',checkout:'2029-01-02'},
 ]) assert.equal(parseHotelBookingSearch(query(changes),now),null,JSON.stringify(changes));
});
test('untrusted routing, PII and offer tokens cannot be forwarded to supplier',()=>{
 const p=query({redirect:'https://attacker.invalid',email:'private@example.invalid',offerId:'never-forward',xData:'never-forward'});
 const url=new URL(hotelWhiteLabelUrl(parseHotelBookingSearch(p,now)));
 for(const key of ['redirect','email','offerId','xData'])assert.equal(url.searchParams.has(key),false);
 for(const hotelId of ['//attacker.invalid','../other','lp33bad?token=x','<script>','a'.repeat(101)]) {
  assert.equal(parseHotelBookingSearch(query({hotelId}),now),null);
 }
 assert.equal(parseHotelBookingSearch(query({currency:'XXS'}),now),null);
 const duplicate=query(); duplicate.append('checkin','2026-10-23');
 assert.equal(parseHotelBookingSearch(duplicate,now),null);
});
test('occupancy validation rejects corrupt base64 and invalid party sizes/ages',()=>{
 for(const value of ['%%%','null','e30=','a'.repeat(4097),btoa('{')])
  assert.equal(parseHotelBookingSearch(query({occupancies:value}),now),null);
 for(const value of [[],{},[{adults:0,children:[]}],[{adults:2,children:[18]}],
  [{adults:2,children:['8']}],[{adults:2,children:[],rooms:9}],
  [{adults:20,children:[8],rooms:2}],[{adults:2.1,children:[]}]])
  assert.equal(normalizeHotelOccupancies(value),null);
 assert.deepEqual(normalizeHotelOccupancies([{adults:1,children:[]}]),[{adults:1,children:[]}]);
});
test('real SDK callback shape is canonicalized without dropping occupancy structure',()=>{
 const future=new Date(Date.now()+86400000*10).toISOString().slice(0,10);
 const end=new Date(Date.now()+86400000*12).toISOString().slice(0,10);
 const parsed=hotelWidgetSearchParams({place:{place_id:'ChIJwe1EZjDG5zsRaYxkjY_tpF0'},
  checkin:future,checkout:end,occupancies:btoa(JSON.stringify(occupancy)),query:'Mumbai'});
 assert.ok(parsed);
 assert.deepEqual(JSON.parse(atob(parsed.get('occupancies'))),occupancy);
 assert.equal(parsed.get('currency'),'INR');
 assert.equal(hotelWidgetSearchParams({place:{description:'Mumbai'}}),null);
});
