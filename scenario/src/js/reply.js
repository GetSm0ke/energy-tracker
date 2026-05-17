// Ответы ассистента

function reply(body, response) {
    var replyData = {
        type: "raw",
        body: body
    };
    response.replies = response.replies || [];
    response.replies.push(replyData);
}

function addSuggestions(suggestions, context) {
    var buttons = [];
    
    suggestions.forEach(function(suggest) {
        buttons.push({
            action: {
                text: suggest,
                type: "text"
            },
            title: suggest
        });
    });
    
    reply({"suggestions": {"buttons": buttons}}, context.response);
}