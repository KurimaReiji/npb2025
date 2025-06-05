
.PHONY: newPlayer rebuild ndjson

GAMEDAY ?= $(shell TZ='America/Los_Angeles' date  --rfc-3339=date)

ndjson: ../docs/npb2025-baserunning.ndjson
newPlayer: daily/$(GAMEDAY).json


daily/$(GAMEDAY).json: ../Games/daily/$(GAMEDAY).json
	node extract-sbs.js $(GAMEDAY)

addenda/$(GAMEDAY).json:
	node addenda.js $(GAMEDAY)

../docs/npb2025-baserunning.ndjson: daily/$(GAMEDAY).json addenda/$(GAMEDAY).json
	node create-ndjson.js

