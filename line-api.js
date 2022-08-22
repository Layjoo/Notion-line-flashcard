const {setCardInterval} = require("./card")

const sendBack = ({displayText, card_id, card_ease, card_current, card_date, deck, tag,}) => {

    const cardState = { card_current: card_current, card_ease: card_ease, card_date: card_date};

    //calculate interval prediction
    const easyPredicted = setCardInterval(cardState, "easy").current;
    const hardPredicted = setCardInterval(cardState, "hard").current;
    const goodPredicted = setCardInterval(cardState, "good").current;

    return {
        type: "text",
        text: displayText,
        quickReply: {
            items: [
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: `again💀`,
                        data: JSON.stringify({
                            card_id: card_id,
                            choice: "again",
                            deck: deck,
                            tag: tag,
                        }),
                        displayText: "again",
                    },
                },
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: `hard😐 (${hardPredicted} วัน)`,
                        data: JSON.stringify({
                            card_id: card_id,
                            choice: "hard",
                            deck: deck,
                            tag: tag,
                        }),
                        displayText: "hard",
                    },
                },
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: `good🙂 (${goodPredicted} วัน)`,
                        data: JSON.stringify({
                            card_id: card_id,
                            choice: "good",
                            deck: deck,
                            tag: tag,
                        }),
                        displayText: "good",
                    },
                },
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: `easy🤣 (${easyPredicted} วัน)`,
                        data: JSON.stringify({
                            card_id: card_id,
                            choice: "easy",
                            deck: deck,
                            tag: tag,
                        }),
                        displayText: "easy",
                    },
                },
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: `suspend🔥`,
                        data: JSON.stringify({
                            card_id: card_id,
                            choice: "suspend",
                            deck: deck,
                            tag: tag,
                        }),
                        displayText: "ระงับการ์ด",
                    },
                },
            ],
        },
    };
};

const sendCard = ({displayText, card_id, deck, tag}) => {
    return {
        type: "text",
        text: displayText,
        quickReply: {
            items: [
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: "เฉลย",
                        data: `{"card_id": "${card_id}", "choice": "back", "deck": "${deck}", "tag": "${tag}"}`,
                        displayText: "เฉลย",
                    },
                },
            ],
        },
    };
};

const sendDecks = async (displayText, decks, tag) => {
    const quickReply = {
        type: "text",
        text: displayText,
        quickReply: {
            items: [
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: "สุ่มการ์ด",
                        data: `{"choice": "selectedDeck","deck": "random", "tag": "random"}`,
                        displayText: "สุ่มการ์ด",
                    },
                },
            ],
        },
    };

    for (let i in decks) {
        quickReply.quickReply.items.push({
            type: "action",
            action: {
                type: "postback",
                label: decks[i],
                data: `{"choice": "selectedDeck", "deck": "${decks[i]}", "tag": null}`,
                displayText: decks[i],
            },
        });
    }

    return quickReply;
};

const sendTag = ({displayText, deck, deck_id, tags}) => {
    const quickReply = {
        type: "text",
        text: displayText,
        quickReply: {
            items: [
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: "สุ่มการ์ด",
                        data: `{"choice": "selectedTag", "tag": "random", "deck": "${deck}","deck_id": "${deck_id}"}`,
                        displayText: "สุ่มการ์ด",
                    },
                },
            ],
        },
    };

    for (let i in tags) {
        quickReply.quickReply.items.push({
            type: "action",
            action: {
                type: "postback",
                label: tags[i],
                data: `{"choice": "selectedTag", "tag": "${tags[i]}", "deck": "${deck}","deck_id": "${deck_id}"}`,
                displayText: tags[i],
            },
        });
    }

    return quickReply;
};

const sendContinue = (remain, deck, deckId, tag) => {
    return {
        type: "text",
        text: `เหลือการ์ดวันนี้อีก ${remain} ใบ`,
        quickReply: {
            items: [
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: "เปิด",
                        data: `{"choice": "next", "deck": "${deck}", "deck_id": "${deckId}", "tag": "${tag}"}`,
                        displayText: "เปิด",
                    },
                },
                {
                    type: "action",
                    action: {
                        type: "postback",
                        label: "ไว้ที่หลัง",
                        data: `{"choice": "later"}`,
                        displayText: "ไว้ที่หลัง",
                    },
                },
            ],
        },
    };
};

const lineMessage = (message) => {
    return {
        type: "text",
        text: message,
    };
};

const bubble = (imageURL) => {
    const bubble = {
        "type": "bubble",
        "size": "kilo",
        "hero": {
          "type": "image",
          "url": `${imageURL}`,
          "size": "full",
          "aspectRatio": "100:100",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": `${imageURL}`
          }
        }
      }

    return bubble;
}

const carouselImg = (images) => {

    const carousel = {
        "type": "flex",
        "altText": "image flex",
        "contents": {
            "type": "carousel",
            "contents": []
        },
    }

    images.forEach((image) => {
        carousel.contents.contents.push(bubble(image))
    });

    return carousel;
}

module.exports = {
    sendBack,
    sendCard,
    sendDecks,
    sendTag,
    sendContinue,
    lineMessage,
    carouselImg
};
