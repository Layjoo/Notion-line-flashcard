require("dotenv").config();
const axios = require("axios");
const notionToken = process.env.NOTION_TOKEN;
const database = process.env.DATABASE;
let date = new Date(Date.now());
const today = date.toISOString().slice(0, 10);

const modifiedData = (data) => {
    const property = data.map((data) => {
        return {
            page_id: data.id.replace(/-/g, ""),
            front: data.properties.front.rich_text[0] &&
                data.properties.front.rich_text[0].plain_text,
            back: data.properties.back.rich_text[0] &&
                data.properties.back.rich_text[0].plain_text,
            date: data.properties.date.date && data.properties.date.date.start,
            current: data.properties.current.rich_text[0] &&
                data.properties.current.rich_text[0].plain_text,
            ease: data.properties.ease.rich_text[0] &&
                data.properties.ease.rich_text[0].plain_text,
        };
    });
    return property;
};

const getTodayCard = async (database) => {
    const config = {
        method: "post",
        url: `https://api.notion.com/v1/databases/${database}/query`,
        headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": "2021-08-16",
            "Content-type": "application/json",
        },
        data: JSON.stringify({
            filter: {
                and: [{
                        property: "status",
                        select: {
                            equals: "enable",
                        },
                    },
                    {
                        or: [{
                                property: "date",
                                date: {
                                    equals: today,
                                },
                            },
                            {
                                property: "date",
                                date: {
                                    is_empty: true,
                                },
                            },

                        ]
                    },
                ],
            },
        }),
    };

    const res = await axios(config);
    const data = res.data.results;
    const cardArr = modifiedData(data);
    return cardArr;
};

const updateCard = async (card) => {
    const pageId = card.page_id;
    const date = card.date;
    const current = card.current;
    const ease = card.ease;

    const config = {
        method: "patch",
        url: `https://api.notion.com/v1/pages/${pageId}`,
        headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": "2021-08-16",
            "Content-type": "application/json",
        },
        data: JSON.stringify({
            properties: {
                date: {
                    date: {
                        start: date,
                    },
                },
                current: {
                    rich_text: [{
                        type: "text",
                        text: {
                            content: current,
                        },
                    }, ],
                },
                ease: {
                    rich_text: [{
                        type: "text",
                        text: {
                            content: ease || "",
                        },
                    }, ],
                },
            },
        }),
    };

    const res = await axios(config);
    return res.date;
};

module.exports = {
    getTodayCard,
    updateCard,
};