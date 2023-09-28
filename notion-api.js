const { Client } = require("@notionhq/client");
require("dotenv").config();

//set today date using thailand timezone instead of any server timezone
const getCurrentTime = () => {
    let today = new Date();
    const offset = 420; // offset in minutes for "Asia/Bangkok" timezone
    const bangkokTime = new Date(today.getTime() + offset * 60000);
    today = bangkokTime.toISOString().slice(0, 10);
    return today
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
//////////////////////////////////////////
//Original function of notion api
//////////////////////////////////////////
const retrieveBlockChildren = async (blockId) => {
    const response = await notion.blocks.children.list({
        block_id: blockId,
    });

    return response.results;
};

const retrieveBlock = async (blockId) => {
    const response = await notion.blocks.retrieve({ block_id: blockId });

    return response;
};

const queryDB = async (databaseId, filterCondition = null) => {
    const options = {
        database_id: databaseId,
    };

    if (filterCondition !== null) {
        options.filter = filterCondition;
    }

    const response = await notion.databases.query(options);

    return response;
};

const updatePageProps = async (pageId, props) => {
    const response = await notion.pages.update({
        page_id: pageId,
        properties: props,
    });

    return response;
};

const retrievePagePropsItems = async (pageId, propsId) => {
    const response = await notion.pages.properties.retrieve({
        page_id: pageId,
        property_id: propsId,
    });

    return response;
};

const retrieveDB = async (databaseId) => {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    return response;
}

const retrievePage = async (pageId) => {
    const response = await notion.pages.retrieve({ page_id: pageId });
    return response;
}

//////////////////////////////////////////
//Modifild notion api for Flashcard bot
//////////////////////////////////////////

//get only page id in database with enable status
const collectAllDecksinDB = async (databaseId) => {
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "status",
            select: {
                equals: "enable",
            },
        },
    });

    const listOfDatabaseID = response.results.map((list) =>
        list.id.replace(/-/g, "")
    );

    console.log(listOfDatabaseID);
    return listOfDatabaseID;
};

//return deck name and deck id
const getAllDecks = async (FlashCardDBSettignId) => {
    const listOfEnablePageInDB = await collectAllDecksinDB(FlashCardDBSettignId);
    const listOfDeckDB = await Promise.all(
        listOfEnablePageInDB.map(async (pageDeck) => {
            const childBlockOfDeck = await retrieveBlockChildren(pageDeck);
            const deckDBId = childBlockOfDeck[0].id.replace(/-/g, "");
            const deckDBName = await retrieveBlock(pageDeck).then(
                (page) => page.child_page.title
            );
            return { deck_name: deckDBName, page_deck: pageDeck, deck_id: deckDBId };
        })
    );

    console.log(listOfDeckDB)

    return listOfDeckDB;
};

//take card content by giving which card's props you want to retrive
const getCardContent = async ({ card_id, properties }, props) => {
    const response = await retrievePagePropsItems(card_id, properties[props].id);
    const propertyType = response.type;

    let cardContent;

    if (propertyType == "property_item") {
        if (response.property_item.type === "rich_text") {
            const textList = response.results.map((results) => {
                const isClozeCard = results.rich_text.annotations.code;
                if (isClozeCard && props == "front") return `??${results.rich_text.plain_text}??`;

                return results.rich_text.plain_text;
            });

            cardContent = textList.join("");
        }

        if (response.property_item.type == "title") {
            return response.results[0].title.plain_text;
        }

        return cardContent;
    }

    if (propertyType == "files") {
        const filesUrl = response.files.map((file) => {
            if (file.type == "external") return file.external.url;
            return file.file.url;
        });

        return filesUrl;
    }

    if (propertyType == "number") {
        return response.number;
    }

    if (propertyType == "select") {
        return response.select && response.select.name;
    }

    if (propertyType == "formula") {
        return response.formula[response.formula.type];
    }

    if (propertyType == "date") {
        return response.date && response.date.start;
    }
};

//filter only enable cards, today cards and overdue cards from given list of decks
const getTodayCard = async (deckId) => {
    const today = getCurrentTime();

    const filterCondition = {
        and: [
            {
                or: [
                    {
                        property: "status",
                        select: {
                            equals: "enable",
                        },
                    }
                ],
            },
            {
                or: [
                    {
                        property: "date",
                        date: {
                            equals: today,
                        },
                    },
                    {
                        property: "date",
                        date: {
                            before: today,
                        },
                    },
                    {
                        property: "date",
                        date: {
                            is_empty: true,
                        },
                    },
                ],
            },
        ],
    };

    const db = await queryDB(deckId, filterCondition);
    const allCards = db.results;

    return allCards.map((card) => {
        return {
            card_id: card.id,
            deck_id: card.parent.database_id,
            properties: card.properties,
        };
    });
};

const getTagsCard = async (deckId, tag) => {
    const today = getCurrentTime();

    const filterCondition = {
        and: [
            {
                property: "tags",
                select: {
                    equals: tag,
                }
            },
            {
                or: [
                    {
                        property: "status",
                        select: {
                            equals: "enable",
                        },
                    },
                    {
                        property: "status",
                        select: {
                            equals: "next",
                        },
                    },
                ],
            },
            {
                or: [
                    {
                        property: "date",
                        date: {
                            equals: today,
                        },
                    },
                    {
                        property: "date",
                        date: {
                            before: today,
                        },
                    },
                    {
                        property: "date",
                        date: {
                            is_empty: true,
                        },
                    },
                ],
            },
        ],
    };

    const db = await queryDB(deckId, filterCondition);
    const allCards = db.results;

    return allCards.map((card) => {
        return {
            card_id: card.id,
            properties: card.properties,
        };
    });
}

const randomCard = (listOfCards) => {
    const random = Math.floor(listOfCards.length * Math.random());
    const randomCard = listOfCards[random];

    return randomCard;
}

const getAllTags = async (deckId) => {
    const response = await retrieveDB(deckId);
    const allTags = response.properties.tags.select.options.map(option => option.name);

    return allTags;
}

const getAllPropsContent = async (cardId, takingProps) => {
    const page = await retrievePage(cardId);
    const card = { card_id: cardId, properties: page.properties };

    const cardContent = {};

    await Promise.all(takingProps.map(async (prop) => {
        cardContent[prop] = await getCardContent(card, prop);
    }))

    return cardContent;
}

const updateCardInterval = async (cardId, { ease, current, date }) => {
    const response = await updatePageProps(cardId, {
        "current": {
            "number": parseInt(current)
        },
        "ease": {
            "number": parseInt(ease)
        },
        "date": {
            "date": {
                "start": date
            }
        }
    })

    return response;
}

const suspendCard = async (cardId) => {
    const response = await updatePageProps(cardId, {
        "status": {
            "select": {
                "name": "suspended"
            }
        }
    })

    return response;
}

module.exports = {
    getAllDecks,
    getTodayCard,
    randomCard,
    getAllTags,
    getTagsCard,
    retrievePage,
    getAllPropsContent,
    updateCardInterval,
    suspendCard,
};


