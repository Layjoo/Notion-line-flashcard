require("dotenv").config();
const axios = require("axios");
const {
    json
} = require("express/lib/response");
const notionToken = process.env.NOTION_TOKEN;
const database = process.env.DATABASE;
let date = new Date(Date.now());
const today = date.toISOString().slice(0, 10);

const modifiedData = (data) => {
    const property = data.map((data) => {
        const card =  {
            "page_id": data.id.replace(/-/g, ""),
            "front": data.properties.front.rich_text[0] &&
                data.properties.front.rich_text[0].plain_text,
            "back": data.properties.back.rich_text[0] &&
                data.properties.back.rich_text[0].plain_text,
            "date": data.properties.date.date && data.properties.date.date.start,
            "current": data.properties.current.rich_text[0] &&
                data.properties.current.rich_text[0].plain_text,
            "ease": data.properties.ease.rich_text[0] &&
                data.properties.ease.rich_text[0].plain_text,
            "back_image": data.properties["back image"].files[0] && data.properties["back image"].files.map(file=>{
                if(file.type == "file"){
                    return file.file.url
                }else{
                    return file.name;
                }
            }),
            "front_image": data.properties["front image"].files[0] && data.properties["front image"].files.map(file=>{
                if(file.type == "file"){
                    return file.file.url
                }else{
                    return file.name;
                }
            })
        };
        
        //check if front has cloze 
        const isCloze = clozeCardModified(data);
        if(isCloze){
            const {front, back} = isCloze;
            card.front = front;
            card.back = back;
        }
        return card;
    });
    return property;
};

const updateSuspend = async (pageId) => {

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
                status: {
                    select: {
                        name: "suspend",
                    },
                }
            },
        }),
    };

    const res = await axios(config);
    return res;
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

const getAllCard = async () => {
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
                }, ],
            },
            sorts: [{
                "timestamp": "last_edited_time",
                "direction": "ascending"
            }]
        }),
    };

    const res = await axios(config);
    const data = res.data.results;
    const cardArr = modifiedData(data);
    return cardArr;
};

const getDeckCard = async (deck) => {
    const config = {
        method: "post",
        url: `https://api.notion.com/v1/databases/${database}/query`,
        headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": "2021-08-16",
            "Content-type": "application/json",
        },
    };

    //set request body
    const data = {
        filter: {
            and: [{
                property: "status",
                select: {
                    equals: "enable",
                },
            }, ],
        },
        sorts: [{
            "timestamp": "last_edited_time",
            "direction": "ascending"
        }]
    }

    //check deck
    if (deck) {
        data.filter.and.push({
            property: "deck",
            select: {
                equals: deck
            }
        })
    }

    config.data = JSON.stringify(data);

    const res = await axios(config);
    const page = res.data.results;
    const cardArr = modifiedData(page);
    return cardArr;
};

const retriveDeck = async (propertyName) => {
    const config = {
        method: 'get',
        url: `https://api.notion.com/v1/databases/${database}`,
        headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": "2021-08-16"
        }
    }

    const response = await axios(config);
    const selectProperty = response.data.properties[propertyName];
    const options = selectProperty.select.options.map(option => option.name)

    return options;
}

const clozeCardModified = (data) => {
    const textArr = data.properties.front.rich_text;
    const cloze = [];
    let text = "";
    for(let i=0; i<textArr.length; i++){
        if(textArr[i].annotations.code == true){
            cloze.push(textArr[i].plain_text);
            text += `{cloze${cloze.length}}`;
        }else{
            text += textArr[i].plain_text
        }
    }

    if(cloze.length!==0){
        const frontCard = text.replace(/\{cloze\d\}/g, ".......")
        let backCard = text;
        cloze.forEach(cloze=>{
            backCard = backCard.replace(/\{cloze\d\}/, `..${cloze}..`);
        })
        return {
            "front": frontCard,
            "back": backCard
        }
    }
}

// (async () => {
//     const config = {
//         method: "post",
//         url: `https://api.notion.com/v1/databases/${database}/query`,
//         headers: {
//             Authorization: `Bearer ${notionToken}`,
//             "Notion-Version": "2021-08-16",
//             "Content-type": "application/json",
//         },
//         data: JSON.stringify({
//             filter: {
//                 and: [{
//                     property: "status",
//                     select: {
//                         equals: "test",
//                     },
//                 }, ],
//             },
//         })
//     }

//     //cloze card testing
//     const res = await axios(config);
//     const textArr = res.data.results.map(result => result.properties.front.rich_text)[0];
//     const cloze = [];
//     let text = "";
//     for(let i=0; i<textArr.length; i++){
//         if(textArr[i].annotations.code == true){
//             cloze.push(textArr[i].plain_text);
//             text += `{cloze${cloze.length}}`;
//         }else{
//             text += textArr[i].plain_text
//         }
//     }
//     console.log(text)
//     console.log(cloze)
//     cloze.forEach(cloze=>{
//         text = text.replace(/\{cloze\d\}/, cloze);
//     })
//     console.log(text)
// })();

module.exports = {
    updateCard,
    getAllCard,
    retriveDeck,
    getDeckCard,
    updateSuspend
};