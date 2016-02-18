//  create an OpenJsCad Processor that renders in given div
// (ensure the div is attached to the document already, otherwise WebGL might be angry.. silently angry)
var gProcessor = new OpenJsCad.Processor(divElementToPutWebGLCanvasIn);

//  get yourself some OpenJsCad source code in a string
var someOpenJsCadSource = "function main() {return CSG.cube();}";

//  render that code in that div
gProcessor.setJsCad(someOpenJsCadSource);