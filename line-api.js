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

const decksCarousel = (deckData) => {

    const bgColor = [
        {primary: "#27ACB2", secondary: "#0D8186", mute: "#9FD8E36E"},
        {primary: "#FF6B6E", secondary: "#DE5658", mute: "#FAD2A76E"},
        {primary: "#A17DF5", secondary: "#7D51E4", mute: "#9FD8E36E"}];
    let bgCount = 0;
    const carousel = {
        "type": "flex",
        "altText": "deck flex",
            "contents": {
            "type": "carousel",
            "contents": [
            ]
        }   
    }

    for(let i in deckData) {

        if(bgCount == bgColor.length){
            bgCount = 0
        }else{
            bgCount++
        }
        
        carousel.contents.contents.push({
            "type": "bubble",
            "size": "micro",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                {
                    "type": "text",
                    "text": `${deckData[i].deck_name}`,
                    "color": "#ffffff",
                    "align": "start",
                    "size": "md",
                    "gravity": "center",
                    "wrap": true
                },
                {
                    "type": "text",
                    "text": `${deckData[i].progression}`,
                    "color": "#ffffff",
                    "align": "start",
                    "size": "xs",
                    "gravity": "center",
                    "margin": "lg"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                        {
                            "type": "filler"
                        }
                        ],
                        "width": `${deckData[i].progression}`,
                        "backgroundColor": `${bgColor[bgCount].secondary}`,
                        "height": "6px"
                    }
                    ],
                    "backgroundColor": `${bgColor[bgCount].mute}`,
                    "height": "6px",
                    "margin": "sm"
                }
                ],
                "backgroundColor": `${bgColor[bgCount].primary}`,
                "paddingTop": "19px",
                "paddingAll": "12px",
                "paddingBottom": "16px",
                "height": "120px"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "button",
                        "action": {
                        "type": "postback",
                        "label": "เปิดการ์ด",
                        "data": `{"choice": "selectedDeck", "deck": "${deckData[i].deck_name}", "tag": null}`
                        },
                        "style": "primary",
                        "height": "sm"
                    }
                    ],
                    "flex": 1,
                    "spacing": "12px",
                    "justifyContent": "center"
                }
                ],
                "spacing": "md",
                "paddingAll": "12px"
            },
            "styles": {
                "footer": {
                "separator": false
                }
            }
        })
    }

    carousel.contents.contents.push(    {
        "type": "bubble",
        "size": "micro",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "image",
              "url": "https://cdn-icons-png.flaticon.com/512/1055/1055804.png",
              "size": "sm",
              "animated": false,
              "margin": "lg"
            }
          ],
          "paddingTop": "19px",
          "paddingAll": "12px",
          "paddingBottom": "16px",
          "height": "120px"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "สุ่มการ์ด",
                "data": `{"choice": "selectedDeck", "deck": "random", "tag": "ramdom"}`
              },
              "style": "secondary",
              "height": "sm"
            }
          ],
          "spacing": "md",
          "paddingAll": "12px"
        },
        "styles": {
          "footer": {
            "separator": false
          }
        }
      })

    return carousel;
}

module.exports = {
    sendBack,
    sendCard,
    sendTag,
    sendContinue,
    lineMessage,
    carouselImg,
    decksCarousel
};
