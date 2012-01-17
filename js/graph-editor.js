if ($ == undefined) {
  $ = django.jQuery;
}

var GraphEditor = {
  DEBUG: true,

  USES_DRAWER: false,
  USES_TYPES: false,

  graphNodesId: "id_graph_nodes",
  graphEdgesId: "id_graph_edges",

  addNodeToList: function(name){
    var nodeList = document.getElementById("node-list");
    var node = this.getGraphNodesJSON()[name];
    if (node.type != undefined){
      name += ' (type: ' + node.type  + ')';
    }
    this.addElementToList(name, nodeList);
  },

  addEdgeToList: function(name){
    var edgeList = document.getElementById("edge-list");
    this.addElementToList(name, edgeList);
  },

  addElementToList: function(name, list){
    var item = document.createElement('li');
    var itemValue = document.createElement('span');
    itemValue.appendChild(document.createTextNode(name));
    item.appendChild(itemValue);
    item.setAttribute("class", "item");
    list.appendChild(item);
  },

  addNode: function(_name, _properties){
    // Only prompts if the parameter is not sent
    var nodeName = _name !== undefined ? _name : prompt("Enter new node name");
    
    var json = this.getGraphNodesJSON();
    if (this.nodeExists(nodeName)){
      alert("ERROR: That node already exists");
      return;
    }
    var data = _properties !== undefined ? _properties : {};
    if (this.USES_TYPES) {
      data["type"] = data.hasOwnProperty('type') ? data["type"] : prompt("Enter new node type");
    }
    json[nodeName] = data;
    this.setGraphNodesJSON(json);
    if (this.USES_DRAWER) {
      if (data.hasOwnProperty('position')){
        this.drawer.addLocatedNode(nodeName, _properties['position']['x'], _properties['position']['y'])
      } else {
        this.drawer.addNode(nodeName);
      }
    }
  },

  deleteNode: function(name){
    var nodeName = prompt("Enter node to be deleted");
    if (!this.nodeExists(nodeName)){
      alert("ERROR: Unknown node: " + nodeName);
      return;
    }
    if (this.nodeBelongsToEdge(nodeName)){
      alert("ERROR: node " + nodeName + " belongs to a relationship. Delete relationship first");
      return;
    }
    var json = this.getGraphNodesJSON();
    delete json[nodeName];
    this.setGraphNodesJSON(json);
    if (this.USES_DRAWER) {
      this.drawer.deleteNode(nodeName);
    }
  },

  addEdge: function(_source, _type, _target){
    // Only prompts if the parameter is not sent
    var edgeSource = _source !== undefined ? _source : prompt("Enter source node");
    var edgeType = _type !== undefined ? _type: prompt("Enter relationship type");
    var edgeTarget = _target !== undefined ? _target: prompt("Enter target node");
    
    if (!this.nodeExists(edgeSource)){
      alert("ERROR: Unknown node: " + edgeSource);
      return;
    }
    if (!this.nodeExists(edgeTarget)){
      alert("ERROR: Unknown node: " + edgeTarget);
      return;
    }
    if (edgeType == "") {
      alert("Relationship type is mandatory");
      return;
    }
    var json = this.getGraphEdgesJSON();
    var newEdge = {"source": edgeSource, "target": edgeTarget, "type": edgeType};
    json.push(newEdge);
    this.setGraphEdgesJSON(json);
    if (this.USES_DRAWER) {
      this.drawer.addEdge(edgeSource, edgeType, edgeTarget);
    }
  },

  deleteEdge: function(number){
    var edgeNumber= parseInt(prompt("Enter edge number to be deleted")) - 1;
    var json = this.getGraphEdgesJSON();
    if (edgeNumber>json.length || edgeNumber<0) {
      alert("Invalid edge number: " + (edgeNumber+1));
      return;
    }
    var newList = []
    for(var i=0;i<json.length;i++) {
      if (i!=edgeNumber) {
        newList.push(json[i]);
      } else {
        if (this.USES_DRAWER) {
          this.drawer.deleteEdge(json[i]["source"],
                                      json[i]["type"],
                                      json[i]["target"]);
        }
      }
    }
    this.setGraphEdgesJSON(newList);
  },

  nodeExists: function(nodeName){
    var nodesJSON = this.getGraphNodesJSON();
    return nodesJSON.hasOwnProperty(nodeName);
  },

  nodeBelongsToEdge: function(name){
    var edges = this.getGraphEdgesJSON();
    for(var i=0;i<edges.length;i++){
      if (edges[i].source==name || edges[i].target==name)
        return true;
    }
    return false;
  },

  getGraphNodesJSON: function(){
    return JSON.parse($('#'+this.graphNodesId).val());
  },

  getGraphEdgesJSON: function(){
    return JSON.parse($('#'+this.graphEdgesId).val());
  },

  setGraphNodesJSON: function(json){
    $('#'+this.graphNodesId).val(JSON.stringify(json));
    this.refresh();
  },

  setGraphEdgesJSON: function(json){
    $('#'+this.graphEdgesId).val(JSON.stringify(json));
    this.refresh();
  },

  clearLists: function(){
    var items = $(".item");
    for(var i=0;i<items.length;i++){
      items[i].parentNode.removeChild(items[i]);
    }
  },

  loadGEXF: function(){
        function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object
    
        for (var i = 0, f; f = files[i]; i++) {
    
          var reader = new FileReader();
    
          // Closure to capture the file information.
          reader.onload = (function(theFile) {
            return function(e) {
              var gexfContent = e.target.result;
              // GEXF IMPORTATION FUNCTION
              $(gexfContent).find('node').each(function(){
                GraphEditor.addNode($(this).attr('label'), {
                                    "score": 0,
                                    "type": $(this).find('attvalue').attr('value'),
                                    "position": {
                                      "x":$(this).find('viz\\:position').attr('x'),
                                      "y":$(this).find('viz\\:position').attr('y')
                                    }
                });
              });
              $(gexfContent).find('edge').each(function(){
                var sourceId = $(this).attr('source');
                var targetId = $(this).attr('target');
                var source = $(gexfContent).find('node#'+sourceId).attr('label');
                var target = $(gexfContent).find('node#'+targetId).attr('label');
                var type = $(this).attr('label');
                GraphEditor.addEdge(source, type, target);
              });
            };
          })(f);
    
          reader.readAsText(f);
        }
      }
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
  },
  
  refresh: function(){
    //Clear everything
    this.clearLists();
    //Set nodes
    var nodes = this.getGraphNodesJSON();
    for(var i in nodes){
      this.addNodeToList(i);
    }
    //Set edges
    var edges = this.getGraphEdgesJSON();
    for(var i=0;i<edges.length;i++){
      var edgeText = edges[i].source + " -> " + edges[i].target + " (" + edges[i].type + ")";
      this.addEdgeToList(edgeText);
    }
  },

  loadSchema: function(){
    // Introspect graph schema
    var nodes = this.getGraphNodesJSON();
    var edges = this.getGraphEdgesJSON();
    var nodeTypes = {};
    for(var i in nodes) {
      if (!nodeTypes.hasOwnProperty(nodes[i].type)) {
        nodeTypes[nodes[i].type] = {};
      }
    }
    var edgeTypes = {}
    for(var i=0;i<edges.length;i++){
      var edgeLabel = nodes[edges[i].source].type + "_" + edges[i].type + "_" + nodes[edges[i].target].type;
      if (!edgeTypes.hasOwnProperty(edgeLabel)) {
        edgeTypes[edgeLabel] = {
          source: nodes[edges[i].source].type,
          label: edges[i].type,
          target: nodes[edges[i].target].type
        };
      }
    }
    var schema = {
      nodeTypes: nodeTypes,
      allowedEdges: edgeTypes
    }
    var list = document.getElementById('graph-schema-nodes');
    $.each(nodeTypes, function(index, value){
      GraphEditor.addElementToList(index, list);
    });
    var list = document.getElementById('graph-schema-edges');
    $.each(edgeTypes, function(index, value){
      var edgeText = value.source + " -> " + value.target + " (" + value.label + ")";
      GraphEditor.addElementToList(edgeText, list);
    });
    $('#id_graph_schema').val(JSON.stringify(schema));
  },

  init: function(){
    this.loadGEXF();
    GraphEditor.refresh();
    
    // Black magic to have the Processing drawer ready to call the drawInitialData method
    // The ajax petition is a straightforward copy from the Processing original code in
    // its init method
    if (GraphEditor.USES_DRAWER){
      $.ajax({
        url: "/js/graphdrawer.pde",
        success: function(block, error){
          GraphEditor.drawer = new Processing(document.getElementById('graphcanvas'), block);
          GraphEditor.drawInitialData();
        },
        error: function(){console.log("error")}
        }
      );
    }
  },
  
  drawInitialData: function(){
    var nodesJSON = this.getGraphNodesJSON();
    var node;
    for(var i in nodesJSON){
      node = nodesJSON[i];
      if (node.hasOwnProperty('position')){
        this.drawer.addLocatedNode(i, node['position']['x'], node['position']['y'])
      } else {
        this.drawer.addNode(i);
      }
    }
    var edges = this.getGraphEdgesJSON();
    for(var i=0;i<edges.length;i++){
      var edge = edges[i];
      this.drawer.addEdge(edge["source"], edge["type"], edge["target"]);
    }
  }
}

$(document).ready(function(){
  GraphEditor.USES_DRAWER = true;
  GraphEditor.USES_TYPES = true;
  GraphEditor.init();
  GraphEditor.refresh();
  // Events linking
  $('#schema-link').click(function(){
    GraphEditor.loadSchema();
  });
});

