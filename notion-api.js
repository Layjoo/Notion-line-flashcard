const { Client } = require("@notionhq/client");
require("dotenv").config();

//set today date using thailand timezone instead of any server timezone
const getCurrentTime = () => {
  let today = new Date();
  const offset = 420; // offset in minutes for "Asia/Bangkok" timezone
  const bangkokTime = new Date(today.getTime() + offset * 60000);
  today = bangkokTime.toISOString().slice(0, 10);
  return today;
};

const notion = new Client({ auth: process.env.NOTION_API_KEY });

//////////////////////// Original function of notion api ////////////////////////////
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

  if (filterCondition) {
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
};

const retrievePage = async (pageId) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
};

//////////////////////// Modifild notion api for Flashcard bot ////////////////////////////

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
  return listOfDeckDB;
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
        },
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
};

const randomCard = (listOfCards) => {
  const random = Math.floor(listOfCards.length * Math.random());
  const randomCard = listOfCards[random];

  return randomCard;
};

const getAllTags = async (deckId) => {
  const response = await retrieveDB(deckId);
  const allTags = response.properties.tags.select.options.map(
    (option) => option.name
  );

  return allTags;
};

const getDeckName = async (deckId) => {
  const response = await notion.pages.retrieve({ page_id: deckId });
  const deckInfo = {
    deck: response.properties.deck.title[0].plain_text,
  };
  return deckInfo;
};

//check cloze card
const modifiedFrontProps = (frontProps) => {
  const textList = frontProps.map((text) => {
    const isClozeCard = text.annotations.code;
    if (isClozeCard)
      return `??${text.plain_text}??`;

    return text.plain_text;
  });

  const cardContent = textList.join("");
  console.log(cardContent)
  return cardContent;
} 

const getCardInfo = async (cardId) => {
  const response = await notion.pages.retrieve({ page_id: cardId });
  const cardInfo = {
    front: modifiedFrontProps(response.properties.front.rich_text),
    back: response.properties.back.rich_text[0]?.plain_text || "",
    ease: response.properties.ease.number,
    current: response.properties.current.number,
    date: response.properties.date.date.start,
    "back image":
      response.properties["back image"].files.length > 0
        ? response.properties["back image"].files.map((file) => {
            if (file.type == "external") return file.external.url;
            return file.file.url;
          })
        : [],
    "front image":
      response.properties["front image"].files.length > 0
        ? response.properties["front image"].files.map((file) => {
            if (file.type == "external") return file.external.url;
            return file.file.url;
          })
        : [],
  };

  return cardInfo;
};

const updateCardInterval = async (cardId, { ease, current, date }) => {
  const response = await updatePageProps(cardId, {
    current: {
      number: parseInt(current),
    },
    ease: {
      number: parseInt(ease),
    },
    date: {
      date: {
        start: date,
      },
    },
  });

  return response;
};

const suspendCard = async (cardId) => {
  const response = await updatePageProps(cardId, {
    status: {
      select: {
        name: "suspended",
      },
    },
  });

  return response;
};

const updateCurrentCard = async (cardId, deck, tag, deck_id = null) => {
  const Props = {
    "current card": [
      {
        type: "text",
        text: {
          content: cardId.replace(/-/g, ""),
        },
      },
    ],
    deck: [
      {
        type: "text",
        text: {
          content: deck ? deck : "",
        },
      },
    ],
    tag: [
      {
        type: "text",
        text: {
          content: tag ? tag : "",
        },
      },
    ],
    deck_id: [
      {
        type: "text",
        text: {
          content: deck_id ? deck_id.replace(/-/g, "") : "",
        },
      },
    ],
  };

  await updatePageProps("ee2bcefaef7a43cba312120ddf040373", Props);
  console.log(`Update current card status: ${cardId} ✅`);
};

const getCurrentCardProps = async () => {
  const response = await queryDB("422d28e9d6104471bd02b0c97016b3cb");
  const props = response.results.map((entry) => ({
    tag: entry.properties["tag"].rich_text[0].plain_text,
    deck_id: entry.properties["deck_id"].rich_text[0].plain_text,
    deck: entry.properties["deck"].rich_text[0].plain_text,
    card_id: entry.properties["current card"].title[0].plain_text || "",
  }));
  console.log(props);
  return props[0];
};

//////////////////////// Deprecated function ////////////////////////////
//take card content by giving which card's props you want to retrive
const getCardContent = async ({ card_id, properties }, props) => {
  const response = await retrievePagePropsItems(card_id, properties[props].id);
  const propertyType = response.type;

  let cardContent;

  if (propertyType == "property_item") {
    if (response.property_item.type === "rich_text") {
      const textList = response.results.map((results) => {
        const isClozeCard = results.rich_text.annotations.code;
        if (isClozeCard && props == "front")
          return `??${results.rich_text.plain_text}??`;

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

const getAllPropsContent = async (cardId, takingProps) => {
  const page = await retrievePage(cardId);

  const card = { card_id: cardId, properties: page.properties };

  const cardContent = {};

  await Promise.all(
    takingProps.map(async (prop) => {
      cardContent[prop] = await getCardContent(card, prop);
    })
  );

  return cardContent;
};

(async () => {})();

module.exports = {
  getAllDecks,
  getTodayCard,
  randomCard,
  getAllTags,
  getTagsCard,
  updateCardInterval,
  suspendCard,
  updateCurrentCard,
  getCurrentCardProps,
  getCardInfo,
  getDeckName,
};

//ee2bcefa-ef7a-43cb-a312-120ddf040373
