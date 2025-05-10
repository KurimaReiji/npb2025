function getTeams(date = '2025-03-28') {
  const dateRegex = /^\d{4}(-\d{2}-\d{2})?$/;
  if (!dateRegex.test(date)) throw new Error(`Invalid date format: ${date}`);
  if (/^\d{4}$/.test(date)) date = `${date}-02-01`;
  if (date < '2005-03-26') throw new Error(`${date} is out of range`);

  const data = teamsdb();
  const teams = {};
  for (const cur of data) {
    if (cur.date > date) continue;
    const team = teams[cur.website] || Object.assign({}, { ...cur });
    Object.assign(team, { ...cur });
    teams[team.website] = team;
  }
  return Object.values(teams);
}

function createFindTeam(teams) {
  const props = [
    "teamName",
    "clubName",
    "franchiseName",
    "shortFranchiseName",
    "officialName",
    "teamCode",
    "jaTeamName",
    "jaClubName",
    "jaFranchiseName",
    "jaShortFranchiseName",
    "jaOfficialName",
    "jaTeamCode",
  ];
  return function (name) {
    const team = teams.find((t) => props.map(prop => t[prop]).some((prop) => prop === name))
    if (!team) {
      throw new Error(`Team not found: ${name}`);
    }
    return team;
  }
}

function teamsdb() {
  return [
    {
      "date": "2005-03-26",
      "teamName": "Giants",
      "clubName": "Giants",
      "franchiseName": "Yomiuri",
      "shortFranchiseName": "Yomiuri",
      "officialName": "Yomiuri Giants",
      "teamCode": "G",
      "jaTeamName": "ジャイアンツ",
      "jaClubName": "ジャイアンツ",
      "jaFranchiseName": "読売",
      "jaShortFranchiseName": "巨人",
      "jaOfficialName": "読売ジャイアンツ",
      "jaTeamCode": "巨",
      "venueId": "081",
      "league": "Central",
      "website": "https://www.giants.jp/",
      "since": "1934-12-26"
    },
    {
      "date": "2005-03-26",
      "teamName": "Tigers",
      "clubName": "Tigers",
      "franchiseName": "Hanshin",
      "shortFranchiseName": "Hanshin",
      "officialName": "Hanshin Tigers",
      "teamCode": "T",
      "jaTeamName": "タイガース",
      "jaClubName": "タイガース",
      "jaFranchiseName": "阪神",
      "jaShortFranchiseName": "阪神",
      "jaOfficialName": "阪神タイガース",
      "jaTeamCode": "神",
      "venueId": "181",
      "league": "Central",
      "website": "https://hanshintigers.jp/",
      "since": "1935-12-10"
    },
    {
      "date": "2005-03-26",
      "teamName": "Dragons",
      "clubName": "Dragons",
      "franchiseName": "Chunichi",
      "shortFranchiseName": "Chunichi",
      "officialName": "Chunichi Dragons",
      "teamCode": "D",
      "jaTeamName": "ドラゴンズ",
      "jaClubName": "ドラゴンズ",
      "jaFranchiseName": "中日",
      "jaShortFranchiseName": "中日",
      "jaOfficialName": "中日ドラゴンズ",
      "jaTeamCode": "中",
      "venueId": "151",
      "league": "Central",
      "website": "https://dragons.jp/",
      "since": "1936-01-15"
    },
    {
      "date": "2005-03-26",
      "teamName": "Buffaloes",
      "clubName": "Buffaloes",
      "franchiseName": "ORIX",
      "shortFranchiseName": "ORIX",
      "officialName": "ORIX Buffaloes",
      "teamCode": "Bs",
      "jaTeamName": "バファローズ",
      "jaClubName": "バファローズ",
      "jaFranchiseName": "オリックス",
      "jaShortFranchiseName": "オリックス",
      "jaOfficialName": "オリックス・バファローズ",
      "jaTeamCode": "オ",
      "venueId": "175",
      "league": "Pacific",
      "website": "https://www.buffaloes.co.jp/",
      "since": "1936-01-23"
    },
    {
      "date": "2005-03-26",
      "teamName": "Hawks",
      "clubName": "Hawks",
      "franchiseName": "SoftBank",
      "shortFranchiseName": "SoftBank",
      "officialName": "Fukuoka SoftBank Hawks",
      "teamCode": "H",
      "jaTeamName": "ホークス",
      "jaClubName": "ホークス",
      "jaFranchiseName": "福岡ソフトバンク",
      "jaShortFranchiseName": "ソフトバンク",
      "jaOfficialName": "福岡ソフトバンクホークス",
      "jaTeamCode": "ソ",
      "venueId": "245",
      "league": "Pacific",
      "website": "https://www.softbankhawks.co.jp/",
      "since": "1938-02-22"
    },
    {
      "date": "2005-03-26",
      "teamName": "Fighters",
      "clubName": "Fighters",
      "franchiseName": "Nippon-Ham",
      "shortFranchiseName": "Nippon-Ham",
      "officialName": "Hokkaido Nippon-Ham Fighters",
      "teamCode": "F",
      "jaTeamName": "ファイターズ",
      "jaClubName": "ファイターズ",
      "jaFranchiseName": "北海道日本ハム",
      "jaShortFranchiseName": "日本ハム",
      "jaOfficialName": "北海道日本ハムファイターズ",
      "jaTeamCode": "日",
      "venueId": "001",
      "league": "Pacific",
      "website": "https://www.fighters.co.jp/",
      "since": "1945-11-06"
    },
    {
      "date": "2005-03-26",
      "teamName": "Lions",
      "clubName": "Lions",
      "franchiseName": "Seibu",
      "shortFranchiseName": "Seibu",
      "officialName": "Seibu Lions",
      "teamCode": "L",
      "jaTeamName": "ライオンズ",
      "jaClubName": "ライオンズ",
      "jaFranchiseName": "西武",
      "jaShortFranchiseName": "西武",
      "jaOfficialName": "西武ライオンズ",
      "jaTeamCode": "西",
      "venueId": "068",
      "league": "Pacific",
      "website": "https://www.seibulions.jp/",
      "since": "1949-11-26"
    },
    {
      "date": "2005-03-26",
      "teamName": "Marines",
      "clubName": "Marines",
      "franchiseName": "Lotte",
      "shortFranchiseName": "Lotte",
      "officialName": "Chiba Lotte Marines",
      "teamCode": "M",
      "jaTeamName": "マリーンズ",
      "jaClubName": "マリーンズ",
      "jaFranchiseName": "千葉ロッテ",
      "jaShortFranchiseName": "ロッテ",
      "jaOfficialName": "千葉ロッテマリーンズ",
      "jaTeamCode": "ロ",
      "venueId": "073",
      "league": "Pacific",
      "website": "https://www.marines.co.jp/",
      "since": "1949-11-26"
    },
    {
      "date": "2005-03-26",
      "teamName": "Carp",
      "clubName": "Carp",
      "franchiseName": "Hiroshima Toyo",
      "shortFranchiseName": "Hiroshima",
      "officialName": "Hiroshima Toyo Carp",
      "teamCode": "C",
      "jaTeamName": "カープ",
      "jaClubName": "カープ",
      "jaFranchiseName": "広島東洋",
      "jaShortFranchiseName": "広島",
      "jaOfficialName": "広島東洋カープ",
      "jaTeamCode": "広",
      "venueId": "208",
      "league": "Central",
      "website": "https://www.carp.co.jp/",
      "since": "1949-12-05"
    },
    {
      "date": "2005-03-26",
      "teamName": "Bay Stars",
      "clubName": "Bay Stars",
      "franchiseName": "Yokohama",
      "shortFranchiseName": "Yokohama",
      "officialName": "Yokohama Bay Stars",
      "teamCode": "YB",
      "jaTeamName": "ベイスターズ",
      "jaClubName": "ベイスターズ",
      "jaFranchiseName": "横浜",
      "jaShortFranchiseName": "横浜",
      "jaOfficialName": "横浜ベイスターズ",
      "jaTeamCode": "横",
      "venueId": "093",
      "league": "Central",
      "website": "https://www.baystars.co.jp/",
      "since": "1949-12-15"
    },
    {
      "date": "2005-03-26",
      "teamName": "Swallows",
      "clubName": "Swallows",
      "franchiseName": "Yakult",
      "shortFranchiseName": "Yakult",
      "officialName": "Yakult Swallows",
      "teamCode": "S",
      "jaTeamName": "スワローズ",
      "jaClubName": "スワローズ",
      "jaFranchiseName": "ヤクルト",
      "jaShortFranchiseName": "ヤクルト",
      "jaOfficialName": "ヤクルトスワローズ",
      "jaTeamCode": "ヤ",
      "venueId": "082",
      "league": "Central",
      "website": "https://www.yakult-swallows.co.jp/",
      "since": "1950-01-12"
    },
    {
      "date": "2005-03-26",
      "teamName": "Eagles",
      "clubName": "Golden Eagles",
      "franchiseName": "Tohoku Rakuten",
      "shortFranchiseName": "Rakuten",
      "officialName": "Tohoku Rakuten Golden Eagles",
      "teamCode": "E",
      "jaTeamName": "イーグルス",
      "jaClubName": "ゴールデンイーグルス",
      "jaFranchiseName": "東北楽天",
      "jaShortFranchiseName": "楽天",
      "jaOfficialName": "東北楽天ゴールデンイーグルス",
      "jaTeamCode": "楽",
      "venueId": "029",
      "league": "Pacific",
      "website": "https://www.rakuteneagles.jp/",
      "since": "2004-11-02"
    },
    {
      "date": "2006-03-25",
      "officialName": "Tokyo Yakult Swallows",
      "franchiseName": "Tokyo Yakult",
      "jaFranchiseName": "東京ヤクルト",
      "jaShortFranchiseName": "ヤクルト",
      "jaOfficialName": "東京ヤクルトスワローズ",
      "website": "https://www.yakult-swallows.co.jp/"
    },
    {
      "date": "2008-03-20",
      "officialName": "Saitama Seibu Lions",
      "franchiseName": "Saitama Seibu",
      "jaFranchiseName": "埼玉西武",
      "jaShortFranchiseName": "西武",
      "jaOfficialName": "埼玉西武ライオンズ",
      "website": "https://www.seibulions.jp/"
    },
    {
      "date": "2012-03-30",
      "teamName": "Baystars",
      "clubName": "Baystars",
      "franchiseName": "YOKOHAMA DeNA",
      "shortFranchiseName": "DeNA",
      "officialName": "YOKOHAMA DeNA BAYSTARS",
      "teamCode": "DB",
      "jaTeamName": "ベイスターズ",
      "jaClubName": "ベイスターズ",
      "jaFranchiseName": "横浜DeNA",
      "jaShortFranchiseName": "DeNA",
      "jaOfficialName": "横浜DeNAベイスターズ",
      "jaTeamCode": "デ",
      "website": "https://www.baystars.co.jp/"
    },
    {
      "date": "2018-11-26",
      "teamCode": "B",
      "website": "https://www.buffaloes.co.jp/"
    },
    {
      "date": "2023-03-14",
      "venueId": "290",
      "website": "https://www.fighters.co.jp/"
    }
  ];
}

function findTeam(name) {
  return createFindTeam(getTeams())(name);
}

export {
  getTeams,
  createFindTeam,
  findTeam,
}
