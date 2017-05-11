module.exports = {
	"receivers" : [],
	"lights" : [
		{
			type: 'milight',
			id: "officeLamp",
			alias: "Office Lamp",
			receiverId: 0,
			groupId: 1, hasRgb: true, hasDimmer: true
		},
		{
			type: 'milight',
			id: "kitchenLamp",
			alias: "Kitchen Lamp",
			receiverId: 0,
			groupId: 2, hasRgb: true, hasDimmer: true
		},
		{
			type: 'milight',
			id: "officeBoards",
			alias: "Office Boards",
			receiverId: 0,
			groupId: 3, hasRgb: true, hasDimmer: true
		},
		{
			type: 'milight',
			id: "kitchenCountertop",
			alias: "Kitchen Countertop",
			receiverId: 0,
			groupId: 4, hasRgb: true, hasDimmer: true
		}
	]
}