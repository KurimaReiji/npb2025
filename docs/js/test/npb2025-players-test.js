import { getPlayers, createFindPlayerById } from '../npb2025-players.js';
import * as chai from "chai";

let playersMay11, playersMay14;
let findPlayerMay11, findPlayerMay14;

before(async function () {
  playersMay14 = await getPlayers('2025-05-14');
  playersMay11 = await getPlayers('2025-05-11');
  findPlayerMay11 = await createFindPlayerById(playersMay11);
  findPlayerMay14 = await createFindPlayerById(playersMay14);
})

describe("Registered players on May 11", async function () {

  it("should return Sunagawa as a Hawk, Akihiro as a Giant", function () {
    const sunagawa = findPlayerMay11('11015136');
    const akihiro = findPlayerMay11('71175153');
    chai.expect(sunagawa.teamCode).to.equal('H');
    chai.expect(akihiro.teamCode).to.equal('G');
  });
});

describe("Registered players on May 14", async function () {
  it("should return correct numbers", function () {
    chai.expect(playersMay14.length).to.equal(801);
    const dragons = playersMay14.filter((player) => player.teamCode === 'D')
    chai.expect(dragons.length).to.equal(68);
  });
  it("should return Sunagawa as a Giant, Akihiro as a Hawk", function () {
    const sunagawa = findPlayerMay14('11015136');
    const akihiro = findPlayerMay14('71175153');
    chai.expect(sunagawa.teamCode).to.equal('G');
    chai.expect(akihiro.teamCode).to.equal('H');
  });
  it("should return Takeuchi correctly", function () {
    const takeuchi = findPlayerMay14('51255159');
    chai.expect(takeuchi.boxscoreName).to.equal('Takeuchi');
  });

});

describe("F Kitayama changed the number", async function () {
  let playersAug06, findPlayerAug06;
  playersAug06 = await getPlayers('2025-08-06');
  findPlayerAug06 = await createFindPlayerById(playersAug06);

  it("should return 57 and 15", function () {
    const kitayama = findPlayerMay14('51755155');
    chai.expect(kitayama.primaryNumber).to.equal('57');
    const kitayama15 = findPlayerAug06('51755155');
    chai.expect(kitayama15.primaryNumber).to.equal('15');
  });
});