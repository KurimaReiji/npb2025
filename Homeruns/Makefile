MAR:= 2025-03-28 2025-03-29 2025-03-30 2025-03-31
APR:= 2025-04-01 2025-04-02 2025-04-03 2025-04-04 2025-04-05 2025-04-06 2025-04-07 2025-04-08 2025-04-09 2025-04-10 2025-04-11 2025-04-12 2025-04-13 2025-04-14 2025-04-15 2025-04-16 2025-04-17 2025-04-18 2025-04-19 2025-04-20 2025-04-21 2025-04-22 2025-04-23 2025-04-24 2025-04-25 2025-04-26 2025-04-27 2025-04-28 2025-04-29 2025-04-30
MAY:= 2025-05-01 2025-05-02 2025-05-03 2025-05-04 2025-05-05 2025-05-06 2025-05-07 2025-05-08 2025-05-09 2025-05-10 2025-05-11 2025-05-12 2025-05-13 2025-05-14 2025-05-15 2025-05-16 2025-05-17 2025-05-18 2025-05-19 2025-05-20 2025-05-21 2025-05-22 2025-05-23 2025-05-24 2025-05-25 2025-05-27 2025-05-28 2025-05-29 2025-05-30 2025-05-31

.PHONY: newPlayer rebuild ndjson publish

GAMEDAY ?= $(shell TZ='America/Los_Angeles' date  --rfc-3339=date)

ndjson: ../docs/npb2025-homeruns.ndjson
newPlayer: daily/$(GAMEDAY).json


daily/$(GAMEDAY).json: ../Games/daily/$(GAMEDAY).json
	node extract_hrs.js $(GAMEDAY)

rebuild:
	node extract_hrs.js $(MAR)
	node extract_hrs.js $(APR)
	node extract_hrs.js $(MAY)

../docs/npb2025-homeruns.ndjson: daily/$(GAMEDAY).json
	jq -c '.[]' daily/*json > ../docs/npb2025-homeruns.ndjson

