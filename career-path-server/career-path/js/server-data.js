var education, profession, aim, query, place, become, mentorQuery;
$('#Cp').show();

function reset() {
	location.reload();
}

sortDropDownListByText('education');
sortDropDownListByText('profession');
sortDropDownListByText('aim');
sortDropDownListByText('place');
sortDropDownListByText('become');

function sortDropDownListByText(selectId) {
	var foption = $('#' + selectId + ' option:first');
	var soptions = $('#' + selectId + ' option:not(:first)').sort(function (a, b) {
		return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
	});
	$('#' + selectId).html(soptions).prepend(foption);
};

function toggle() {
	var x = document.getElementById("career-div");
	if (x.style.display === "none") {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	}
}

function toggle1() {
	var x = document.getElementById("career-div1");
	if (x.style.display === "none") {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	}
}

getOptionMp = () => {
	var a = document.getElementById("place");
	place = a.options[a.selectedIndex].value;

	var c = document.getElementById("become");
	become = c.options[c.selectedIndex].value;

	mentorQuery = {
		"query": "MATCH (p:Person) WHERE (p.ClassX_Place = {location} OR p.ClassXII_Place = {location} OR p.Graduation_Place = {location} OR p.Masters_Place = {location}) AND (p.Job1_Role = {role} OR p.Job2_Role = {role} OR p.Job3_Role = {role} OR p.Job4_Role = {role} OR p.Job5_Role = {role} OR p.Job6_Role = {role}) return p.name, p.Graduation_Degree, p.Masters_Degree, p.Job1_Role, p.Job2_Role, p.Job3_Role, p.Job4_Role, p.Job5_Role, p.Job6_Role",
		"params": {
			"location": place,
			"role": become
		}
	}

	if (place && become) {
		getDataMp();
	}
}
getDataMp = () => {

	$.ajax({
		type: 'POST',
		url: 'http://localhost:3000/career-path',
		contentType: 'application/json',
		data: JSON.stringify(mentorQuery),
		success: (response) => {},
		error: (error) => {
			console.log("Data failed");
		},
		complete: (resp) => {
			console.log('DB response mentor data: ', resp.responseJSON);
			let mentors = resp.responseJSON.data;
			console.log("name: ", mentors)
			var finalData = '';
			for (var i = 0; i < mentors.length; i++) {
				var mentor = mentors[i];
				var uniqueFields = _.compact(_.uniq(mentor));
				var mentorData = uniqueFields[0] + ' : ' + uniqueFields[1] + ' -> ' + uniqueFields.slice(2, uniqueFields.length).join(' | ');
				finalData += '<p>' + mentorData + '</p>'
			}

			var div = document.getElementById('mentorData');
			div.innerHTML = finalData;
		},
	});
}

function getOption() {
	var a = document.getElementById("education");
	education = a.options[a.selectedIndex].value;

	var b = document.getElementById("profession");
	profession = b.options[b.selectedIndex].value;

	var c = document.getElementById("aim");
	aim = c.options[c.selectedIndex].value;

	query = "MATCH p=(e)-[*]->(r) WHERE ";
	if (education) {
		query += "e.name = '" + education + "'";
	}
	if (aim) {
		query += "AND r.name = '" + aim + "'";
	}
	if (profession) {
		query += "and ANY (i IN nodes(p) WHERE i.name = '" + profession + "') ";
	}
	query += " RETURN EXTRACT(x IN NODES(p)[..-1] | x.name), nodes(p), relationships(p)";
	console.log(query);

	if (education || profession || aim) {
		getData();
	}
}

function getData() {
	$.ajax({
		type: 'POST',
		dataType: "json",
		url: 'http://localhost:3000/career-path',
		data: {
			"query": query
		},
		success: (response) => {},
		error: (error) => {
			console.log("Data failed");
		},
		complete: (resp) => {
			console.log('DB response: ', resp.responseJSON);
			if (resp.responseJSON.data.length === 0) {
				element = document.getElementById("no-records");
				element.classList.remove("display-none");
				element.classList.add("display-block");
			} else {
				element = document.getElementById("no-records");
				element.classList.remove("display-block");
				element.classList.add("display-none");
			}
			element = document.getElementById("no-records");
			element.classList.add("display-none");
			let serverData = parseServerData(resp.responseJSON);
			let graphData = parseData(serverData);
			draw(graphData);
		},
	});
}
opentab = (event, id) => {
	if (id === 'Cp') {
		$('#Mp').hide();
		$('#' + id).show();
		$('#b').removeClass('active');
		$('#a').addClass('active');
	} else {
		$('#a').removeClass('active');
		$('#b').addClass('active');
		$('#Cp').hide();
		$('#' + id).show();
	}
}

function parseServerData(rawdata) {
	let jsondata = rawdata;
	let nodeIds = [];
	let nodeList = [];
	let relationList = [];
	let data = jsondata.data;
	const nodePrefix = "http://localhost:7474/db/data/node/";
	const relPrefix = "http://localhost:7474/db/data/relationship/";
	data.forEach(function (element) {
		let nodes = element[1];
		nodes.forEach(function (node) {
			if (_.indexOf(nodeIds, node.metadata.id) == -1) {
				nodeList.push({
					"id": node.metadata.id,
					"name": node.data.name
				});
				nodeIds.push(node.metadata.id);
			}
		});
		let relations = element[2];
		relations.forEach(function (rel) {
			let relId = _.replace(rel.self, relPrefix, '');
			let startId = _.replace(rel.start, nodePrefix, '');
			let endId = _.replace(rel.end, nodePrefix, '');
			relationList.push({
				"relId": relId,
				"startId": startId,
				"endId": endId,
				"noOfPeople": rel.data.count
			});
		});
	});
	let output = {
		"nodes": nodeList,
		"relations": relationList
	};
	return output;
}


function parseData(serverData) {
	var convertedData = {
		nodes: [],
		links: []
	};
	var careerPath = serverData; //{"nodes":[{"name":"Class 10","id":"956236"},{"name":"Class 12","id":"956243"},{"name":"ME","id":"956238"},{"name":"Software Engineer","id":"956237"},{"name":"Senior SE","id":"956245"},{"name":"TM","id":"956239"},{"name":"TCE","id":"956244"},{"name":"CSE","id":"956226"}],"relations":[{"relId":"812180","endId":"956243","startId":"956236","noOfPeople":"9"},{"relId":"812274","endId":"956238","startId":"956243","noOfPeople":"1"},{"relId":"812176","endId":"956237","startId":"956238","noOfPeople":"1"},{"relId":"812192","endId":"956245","startId":"956237","noOfPeople":"4"},{"relId":"812275","endId":"956239","startId":"956245","noOfPeople":"1"},{"relId":"812272","endId":"956244","startId":"956243","noOfPeople":"1"},{"relId":"812172","endId":"956237","startId":"956244","noOfPeople":"1"},{"relId":"812271","endId":"956226","startId":"956243","noOfPeople":"4"},{"relId":"812182","endId":"956237","startId":"956226","noOfPeople":"3"}]}

	var nodesLen = careerPath.nodes.length;
	for (i = 0; i < nodesLen; i++) {
		var node = careerPath.nodes[i];
		convertedData.nodes.push({
			"name": node.name
		});
		nodeMap[node.id] = {
			index: i,
			name: node.name
		};
	}

	var relationesLen = careerPath.relations.length;
	for (j = 0; j < relationesLen; j++) {
		var relation = careerPath.relations[j];
		var link = {};
		link.source = getNodeIndex(relation.startId);
		link.target = getNodeIndex(relation.endId);
		link.value = relation.noOfPeople;

		convertedData.links.push(link);
	}

	return convertedData;
}

function getNodeIndex(nodeId) {
	return nodeMap[nodeId].index;
}