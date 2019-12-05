/**
 * @Author: Sam
 * @Date: 2019/12/4
 * @Version: 1.0
 **/
var express = require('express')
var router = express.Router()
var fs = require('fs')

const ERR_OK = 0
const INV_EXT = 5

/**
 * POST
 * upload - upload files
 * @param req
 * @param res
 */
router.upload = (req, res) => {
    let file = req.file
    let filepath
    if (file.originalname.endsWith('.jpg')) {
        filepath = `uploads/${file.filename}.jpg`
    } else if (file.originalname.endsWith('.png')) {
        filepath = `uploads/${file.filename}.png`
    } else {
        res.send(JSON.stringify({code: INV_EXT, message: 'Invalid file type'}, null, 5))
    }
    fs.rename(file.path, filepath, function(err) {
        if (err) {
            throw err
        }
    })
    res.send(JSON.stringify({code: ERR_OK, filepath: filepath, message: 'Successfully uploading'}, null, 5))
}

/**
 * POST
 * uploadmul - upload multiple images
 * @param req
 * @param res
 */
router.uploadmul = (req, res) => {
    let files = req.files
    let filepaths = []
    files.forEach((file) => {
        let filepath
        if (file.originalname.endsWith('.jpg')) {
            filepath = `uploads/${file.filename}.jpg`
        } else if (file.originalname.endsWith('.png')) {
            filepath = `uploads/${file.filename}.png`
        }
        fs.rename(file.path, filepath, function(err) {
            if (err) {
                throw err
            }
        })
        filepaths.push(filepath)
    })
    res.send(JSON.stringify({code: ERR_OK, filepaths: filepaths, message: 'Successfully uploading multiple images'}, null, 5))
}

/**
 * GET
 * getImage - get image
 * @param req
 * @param res
 */
router.getImage = (req, res) => {
    let filepath = `uploads/${req.params.filename}`
    fs.exists(filepath, (exists) => {
        res.sendfile(exists ? filepath : 'assets/default.jpg')
    })
}

module.exports = router
