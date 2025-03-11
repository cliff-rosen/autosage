{
    "parameters": [
        {
            "name": "query",
            "description": "The search query text",
            "schema": {
                "name": "query",
                "type": "string",
                "description": null,
                "is_array": false,
                "items": null,
                "fields": null
            }
        }
    ],
        "outputs": [
            {
                "name": "results",
                "description": "List of search result objects",
                "schema": {
                    "name": "results",
                    "type": "object",
                    "description": "Array of search result objects",
                    "is_array": true,
                    "fields": {
                        "title": {
                            "name": "title",
                            "type": "string",
                            "description": "Title of the search result",
                            "is_array": false,
                            "items": null,
                            "fields": null
                        },
                        "link": {
                            "name": "link",
                            "type": "string",
                            "description": "URL of the search result",
                            "is_array": false,
                            "items": null,
                            "fields": null
                        },
                        "snippet": {
                            "name": "snippet",
                            "type": "string",
                            "description": "Text snippet from the search result",
                            "is_array": false,
                            "items": null,
                            "fields": null
                        },
                        "displayLink": {
                            "name": "displayLink",
                            "type": "string",
                            "description": "Display URL of the search result",
                            "is_array": false,
                            "items": null,
                            "fields": null
                        },
                        "relevance_score": {
                            "name": "relevance_score",
                            "type": "number",
                            "description": "Relevance score of the search result",
                            "is_array": false,
                            "items": null,
                            "fields": null
                        }
                    }
                }
            }
        ]
}