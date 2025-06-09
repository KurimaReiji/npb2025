GAMEDAY := $(shell TZ='America/Los_Angeles' date --rfc-3339=date)

.PHONY: boxscoreNames newPlayer

boxscoreNames:
	node boxscoreName.js $(GAMEDAY)

newPlayer:
	node getters/get-registered.js
	node getters/get-en-roster.js
	node getters/get-roster.js
	node create-players.js
