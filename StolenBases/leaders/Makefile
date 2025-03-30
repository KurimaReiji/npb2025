YESTERDAY := $(shell TZ='Asia/Tokyo' date -d "2 days ago" --rfc-3339=date)

$(YESTERDAY).json:
	node ./get_leaders.js
