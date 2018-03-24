var nodeType_Comment = 8;
var nodeType_Text = 3;
var nodeType_Element = 1;

function cleanWhitespace(node) {
    for (var n = 0; n < node.childNodes.length; n++) {
        var child = node.childNodes[n];
        if (child.nodeType === nodeType_Comment || (child.nodeType === nodeType_Text && !/\S/.test(child.nodeValue))) {
            node.removeChild(child);
            // n--;
        }
        else if (child.nodeType === nodeType_Element) {
            clean(child);
        }
    }
};
