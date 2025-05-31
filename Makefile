GAMEDAY ?= $(shell TZ='America/Los_Angeles' date  --rfc-3339=date)
#GAMEDAY := 2025-05-17

.PHONY: gamesover ja en players standings Homeruns StolenBases nightly

gamesover: standings Homeruns
nightly: players
ja: Games/daily/$(GAMEDAY).json
en: en-scraped/daily/$(GAMEDAY).json
players: docs/npb2025-players.ndjson
standings: docs/standings.json

docs/npb2025-results.ndjson: Games/daily/$(GAMEDAY).json
	node Games/create-results.js $(GAMEDAY)

docs/standings.json: docs/npb2025-results.ndjson
	node Games/create-standings.js

docs/npb2025-players.ndjson: Players/boxscoreNames.ndjson
	node Players/create-players.js
	node Games/create-games.js $(GAMEDAY)

Games/daily/$(GAMEDAY).json: scraped/daily/$(GAMEDAY).json
	node Games/create-games.js $(GAMEDAY)

Players/boxscoreNames.ndjson: en-scraped/daily/$(GAMEDAY).json
	node Players/boxscoreName.js $(GAMEDAY)

scraped/daily/$(GAMEDAY).json:
	node scraped/get-game-info.js $(GAMEDAY)

en-scraped/daily/$(GAMEDAY).json:
	node en-scraped/en-get-game-info.js $(GAMEDAY)

Homeruns:
	make -C $@ ndjson

StolenBases:
	make -C $@ ndjson
