const {setCardInterval} = require("./card")
const fetch = require('node-fetch');

const sendBack = ({displayText, card_id, card_ease, card_current, card_date, tag, deck, deck_id}) => {

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
                            deck_id: deck_id,
                            tag: tag,
                            card_state: cardState
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
                            deck_id: deck_id,
                            tag: tag,
                            card_state: cardState
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
                            deck_id: deck_id,
                            tag: tag,
                            card_state: cardState
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
                            deck_id: deck_id,
                            tag: tag,
                            card_state: cardState
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
                            deck_id: deck_id,
                            tag: tag,
                            card_state: cardState
                        }),
                        displayText: "ระงับการ์ด",
                    },
                },
            ],
        },
    };
};

const sendCard = ({displayText, card_id, deck, deck_id, tag}) => {
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
                        data: `{"card_id": "${card_id}", "choice": "back", "deck": "${deck}", "deck_id": "${deck_id}", "tag": "${tag}"}`,
                        displayText: "เฉลย",
                    },
                },
            ],
        },
    };
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

const sendContinue = (remain, deck, deck_id, tag) => {
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
                        data: `{"choice": "next", "deck": "${deck}", "deck_id": "${deck_id}", "tag": "${tag}"}`,
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

    return [carousel];
}

const decksCarousel = (deckData) => {

    const carousel = {
        "type": "flex",
        "altText": "เลือกสำรับ",
            "contents": {
                "type": "bubble",
                "direction": "ltr",
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "text",
                          "text": "เลือกสำรับ",
                          "weight": "bold",
                          "size": "lg",
                          "color": "#29BA24FF",
                          "align": "start",
                          "contents": []
                        }
                      ]
                    },
                    {
                      "type": "separator",
                      "margin": "md"
                    },

                    ...deckData.map((deck) => ({
                      "type": "box",
                      "layout": "horizontal",
                      "margin": "md",
                      "height": "20px",
                      "contents": [
                        {
                          "type": "text",
                          "text": deck.deck_name,
                          "weight": "bold",
                          "size": "sm",
                          "color": "#535353FF",
                          "align": "start",
                          "contents": []
                        },
                        {
                          "type": "box",
                          "action": {
                            "type": "postback",
                            "label": `เปิด ${deck.deck_name}`,    
                            "text": `เปิด ${deck.deck_name}`,
                            "data": `{"choice": "selectedDeck", "deck": "${deck.deck_name}", "tag": null, "deck_id": "${deck.deck_id}"}`
                          },
                          "layout": "horizontal",
                          "width": "35px",
                          "backgroundColor": "#65C060FF",
                          "cornerRadius": "20px",
                          "contents": [
                            {
                              "type": "text",
                              "text": "เปิด",
                              "weight": "bold",
                              "size": "xs",
                              "color": "#FFFFFFFF",
                              "align": "center",
                              "contents": []
                            }
                          ]
                        }
                      ]
                    }))

                  ]
                },
                "footer": {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "button",
                      "action": {
                        "type": "postback",
                        "label": "สุ่มการ์ดวันนี้",
                        "text": "สุ่มการ์ดวันนี้",
                        "data": `{"choice": "selectedDeck", "deck": "random", "tag": "ramdom"}`
                      },
                      "height": "sm",
                      "style": "primary"
                    }
                  ]
                }
              }   
    }

    return carousel;
}

async function processImages(imageURLs) {
    const modifiedImages = [];
    let shouldUseCarousel = false;

    for (const imageURL of imageURLs) {
        try {
            const response = await fetch(imageURL, { method: 'HEAD' });
            if (response.status === 200) {
                const contentLength = response.headers.get('content-length');

                const url = new URL(imageURL);

                if (url.hostname === "imgur.com") {
                    modifiedImages.push({
                        "type": "image",
                        "originalContentUrl": imageURL.replace(".png", "l.png"),
                        "previewImageUrl": imageURL.replace(".png", "s.png")
                    });
                } else if (imageURL.endsWith(".png") || imageURL.endsWith(".jpg")) {
                    if (contentLength <= 10485760) { // 10MB for originalContentUrl
                        modifiedImages.push({
                            "type": "image",
                            "originalContentUrl": imageURL,
                            "previewImageUrl": imageURL
                        });
                    } else {
                        shouldUseCarousel = true;
                    }
                } else {
                    shouldUseCarousel = true;
                }
            } else {
                shouldUseCarousel = true;
            }
        } catch (error) {
            console.error("Error fetching image:", error);
            shouldUseCarousel = true;
        }
    }

    if (shouldUseCarousel) {
        return carouselImg(imageURLs);
    }

    return modifiedImages;
}

module.exports = {
    sendBack,
    sendCard,
    sendTag,
    sendContinue,
    lineMessage,
    carouselImg,
    decksCarousel,
    processImages
};
