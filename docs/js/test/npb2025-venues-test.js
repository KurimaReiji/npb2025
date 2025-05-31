import { findVenue } from '../npb2025-venues.js';
import * as chai from "chai";

describe("Venues for 2025 Season", async function () {

  it("should return 'Vantelin Dome'", function () {
    const nagoyaDome = findVenue('バンテリンドーム');
    chai.expect(nagoyaDome.boxscoreName).to.equal('Vantelin Dome');
  });

  it("should return 'Morioka'", function () {
    const kitagin = findVenue('盛　岡');
    const kitagin2 = findVenue('いわて盛岡ボールパーク');
    chai.expect(kitagin.boxscoreName).to.equal('Morioka');
    chai.expect(kitagin2.boxscoreName).to.equal('Morioka');
  });

  it("should return 'Naha'", function () {
    const naha = findVenue('那　覇');
    const naha2 = findVenue('那覇市営奥武山野球場');
    chai.expect(naha.boxscoreName).to.equal('Naha');
    chai.expect(naha2.boxscoreName).to.equal('Naha');
    chai.expect(naha.name).to.equal('Okinawa Cellular Stadium Naha');
  });
});
