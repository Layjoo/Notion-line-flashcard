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
    carouselImg
}