/**
 * @Author: Sam
 * @Date: 2019/12/2
 * @Version: 1.0
 **/
var express = require('express')
var router = express.Router()
var sha1 = require('sha1')
var jwt = require('jsonwebtoken')
var config = require('../config')
var axios = require('axios')

// Constant
const superSecret = config.superSecret
const ERR_NOK = -1
const ERR_OK = 0
const GITHUB = 'github'
const GITLAB = 'gitlab'
const GITEE = 'gitee'
const BITBUCKET = 'bitbucket'
const WEIBO = 'weibo'

router.getGithubToken = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    let client_id = req.query.client_id
    let client_secret = req.query.client_secret
    let code = req.query.code
    axios.post(`https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`, {}, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        let resdata = response.data
        let accessToken = resdata.access_token
        if (accessToken) {
            axios.get(`https://api.github.com/user?access_token=${accessToken}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let profile = response.data
                let account = {
                    username: profile.login,
                    name: profile.name,
                    avatar: profile.avatar_url,
                    type: GITHUB
                }
                let token = jwt.sign({username: account.username}, superSecret, {
                    // 1 hour
                    expiresIn: 3600
                })
                res.send(JSON.stringify({
                    code: ERR_OK,
                    token: token,
                    account: account,
                    message: 'Successfully login, use your token'
                }, null, 5))
            })
        } else {
            res.send(JSON.stringify({
                code: ERR_NOK,
                message: 'Invalid token'
            }, null, 5))
        }
    }).catch(e => {
        console.log(e)
    })
}

router.getGitlabToken = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    let client_id = req.query.client_id
    let client_secret = req.query.client_secret
    let code = req.query.code
    let redirect_uri = req.query.redirect_uri
    axios.post(`https://gitlab.com/oauth/token?client_id=${client_id}&client_secret=${client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirect_uri}`, {}, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log(response)
        res.setHeader('Access-Control-Allow-Origin', '*')
        let resdata = response.data
        let accessToken = resdata.access_token
        if (accessToken) {
            axios.get(`https://gitlab.com/api/v4/user?access_token=${accessToken}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let profile = response.data
                let account = {
                    username: profile.username,
                    name: profile.name,
                    avatar: profile.avatar_url,
                    type: GITLAB
                }
                let token = jwt.sign({username: account.username}, superSecret, {
                    // 1 hour
                    expiresIn: 3600
                })
                res.send(JSON.stringify({
                    code: ERR_OK,
                    token: token,
                    account: account,
                    message: 'Successfully login, use your token'
                }, null, 5))
            })
        } else {
            res.send(JSON.stringify({
                code: ERR_NOK,
                message: 'Invalid token'
            }, null, 5))
        }
    }).catch(e => {
        console.log(e)
    })
}

router.getGiteeToken = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    let client_id = req.query.client_id
    let client_secret = req.query.client_secret
    let code = req.query.code
    let grant_type = req.query.grant_type
    let redirect_uri = req.query.redirect_uri
    axios.post(`https://gitee.com/oauth/token?grant_type=${grant_type}&code=${code}&client_id=${client_id}&redirect_uri=${redirect_uri}&client_secret=${client_secret}`, {}, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        let resdata = response.data
        let accessToken = resdata.access_token
        if (accessToken) {
            axios.get(`https://gitee.com/api/v5/user?access_token=${accessToken}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let profile = response.data
                let account = {
                    username: profile.login,
                    name: profile.name,
                    avatar: profile.avatar_url,
                    type: GITEE
                }
                let token = jwt.sign({username: account.username}, superSecret, {
                    // 1 hour
                    expiresIn: 3600
                })
                res.send(JSON.stringify({
                    code: ERR_OK,
                    token: token,
                    account: account,
                    message: 'Successfully login, use your token'
                }, null, 5))
            })
        } else {
            res.send(JSON.stringify({
                code: ERR_NOK,
                message: 'Invalid token'
            }, null, 5))
        }
    }).catch(e => {
        console.log(e)
    })
}

router.getBitbucketToken = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    let access_token = req.query.access_token
    axios.get(`https://bitbucket.org/api/2.0/user?access_token=${access_token}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        let profile = response.data
        let account = {
            username: profile.username,
            name: profile.display_name,
            avatar: profile.links.avatar.href,
            type: BITBUCKET
        }
        let token = jwt.sign({username: account.username}, superSecret, {
            // 1 hour
            expiresIn: 3600
        })
        res.send(JSON.stringify({
            code: ERR_OK,
            token: token,
            account: account,
            message: 'Successfully login, use your token'
        }, null, 5))
    })
}

router.getWeiboToken = (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    let client_id = req.query.client_id
    let client_secret = req.query.client_secret
    let code = req.query.code
    let grant_type = req.query.grant_type
    let redirect_uri = req.query.redirect_uri
    axios.post(`https://api.weibo.com/oauth2/access_token?grant_type=${grant_type}&code=${code}&client_id=${client_id}&redirect_uri=${redirect_uri}&client_secret=${client_secret}`, {}, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        let resdata = response.data
        let accessToken = resdata.access_token
        let uid = resdata.uid
        if (accessToken && uid) {
            axios.get(`https://api.weibo.com/2/users/show.json?access_token=${accessToken}&uid=${uid}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let profile = response.data
                let account = {
                    username: profile.screen_name,
                    name: profile.name,
                    avatar: profile.profile_image_url,
                    type: WEIBO
                }
                let token = jwt.sign({username: account.username}, superSecret, {
                    // 1 hour
                    expiresIn: 3600
                })
                res.send(JSON.stringify({
                    code: ERR_OK,
                    token: token,
                    account: account,
                    message: 'Successfully login, use your token'
                }, null, 5))
            })
        } else {
            res.send(JSON.stringify({
                code: ERR_NOK,
                message: 'Invalid token'
            }, null, 5))
        }
    }).catch(e => {
        console.log(e)
    })
}

module.exports = router
