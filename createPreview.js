const sqip = require('sqip')
const jsdom = require("jsdom");
const fs = require('fs')

const { JSDOM } = jsdom;

const sourceHtml = 'src-index.html'
const destHtml = 'index.html'

const sourceImageFolder = 'images/'
const numberOfPrimitives = 8
const mode = 4
const blur = 90

const imgContainer = []

transform()

function transform() {
  fs.readdir(sourceImageFolder, (err, images) => {
    if (err) {
      console.log(err)
      return
    }
    console.log(`The folder ${sourceImageFolder} contains ${images.length} images`)
    images.forEach( (img) => {
      const inputFilename = img.split('.')[0]
      const inputSuffix = img.split('.')[1]
      // Exclude svg images
      if (inputSuffix === 'svg') {
        return
      }
      console.log(img)
      const inputImgPath = sourceImageFolder + img

      const transformedImage = sqip({
        filename: inputImgPath,
        numberOfPrimitives,
        mode,
        blur
      })

      // Replace the height and width so it corresponds to the viewbox

      const tempSVG = transformedImage.final_svg
      const reHash = /#/g
      const temp2SVG = tempSVG.replace(reHash, '%23')

      const height = transformedImage.img_dimensions.height
      const width = transformedImage.img_dimensions.width

      const reWidthHeight = /h\d+v\d+/

      const finalSVG = temp2SVG.replace(reWidthHeight, `h${width}v${height}`)

      imgContainer.push({
        name: img,
        svg: finalSVG
      })

    })
    replaceHtmlSrc(imgContainer)
  })
}


function replaceHtmlSrc(imgContainer) {
  fs.readFile(sourceHtml, 'utf-8', (err, data) => {
    if (err) console.log(err)
    const dom = new JSDOM(data)
    const images = (dom.window.document.querySelectorAll("img[data-src]"))

    images.forEach((img) => {
      const dataSrc = img.dataset.src
      const imgName = dataSrc.split('\\')[2]

      imgContainer.forEach((obj)=> {
        if (imgName === obj.name) {
          img.src = 'data:image/svg+xml;utf8,' + obj.svg
        }
      })
    })

    const editedHtml = dom.serialize()
    fs.writeFile(destHtml, editedHtml, (err) => {
      if (err) console.log(err)
      console.log(`The file ${destHtml} has been saved!`)
    })
  });
}