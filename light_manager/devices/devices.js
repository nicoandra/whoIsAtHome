module.exports = {
	"portableDevices" : [
		{ name : "Nic phone", address : "192.168.1.141" }
	],
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
			groupId: 4, hasRgb: false, hasDimmer: true
		},
		{
			type: 'espLight',
			id: "screen1",
			alias: "Screen 1",
			macAddress: "60019449CB55",
			channel: 1
		},
		{
			type: 'espLight',
			id: "screen2",
			alias: "Screen 2",
			macAddress: "60019449CB55",
			channel: 2
		},
		{
			type: 'espLight',
			id: "screen3",
			alias: "Screen 3",
			macAddress: "60019449CB55",
			channel: 4
		}

	],
	"heaters" : [
		{id: 'dev' , alias: 'Dev', slot: 1, ip: '192.168.1.113', port: 8888 },
		{id: 'living' , alias: 'Living', slot: 1, ip: '192.168.1.130', port: 8888 },
		{id: 'livingDual' , alias: 'Living Dual', slot: 1, ip: '192.168.1.133', port: 8888 },
		{id: 'officeDual' , alias: 'Office Dual', slot: 2, ip: '192.168.1.133', port: 8888 },
	]
}