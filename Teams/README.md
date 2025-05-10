# Teams

NPBチームのデータベース。2005年のイーグルス加入以降の、球団名の変更や本拠地移転などの情報をまとめている。

東北楽天のデータは以下の通り。

```
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
}
```

利用方法は以下を参考に。

- [Mocha Report](https://kurimareiji.github.io/npb2025/js/test/npb-teams-test.html)

## 2005年シーズン以降の変化

- 2005 楽天が加入
- 2006 ヤクルトが東京ヤクルトに
- 2008 西武が埼玉西武に
- 2012 横浜が横浜DeNAに
- 2019 オリックスがBsからBに 参考：[アルファベット表記変更の件【Bs→B】（2018年11月26日）](https://npb.jp/games/2019/schedule_note_b.html)
- 2023 ファイターズが本拠地球場移転

## teamName と clubName

MLBのAPIでは、Arizona Diamondbacks のデータは以下のようになっている。

```
{
  "name": "Arizona Diamondbacks",
  "teamName": "D-backs",
  "clubName": "Diamondbacks",
  "shortName": "Arizona",
  "franchiseName": "Arizona",
  "teamCode": "ari",
  "abbreviation": "AZ"
}
```

これにならい、楽天のデータは前述のようにしている。

## Notes

- 「読売」と「巨人」の使い分けは不詳
- 日付が確定できないイベントはシーズン開幕日としている。
- teamId を勝手に決めるのは躊躇われるので保留（現在は website を代替利用）。
