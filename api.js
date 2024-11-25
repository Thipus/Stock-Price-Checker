'use strict';
const { forEach } = require('mocha/lib/utils');
const bcrypt = require('bcrypt')

module.exports = function (app) {
  console.log("Début")
  let ip_list=[]
  let stocks=[]

  async function getPrice(stock){
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`, {
      method: 'GET',
      credentials: 'same-origin'
    });
    const {symbol, latestPrice} = await response.json();
    return new Promise(res=>res({ symbol, latestPrice }));
  }

  async function searchCurrentStocks(stockToSearch){
    if (stocks.length!=0){
    stocks.forEach(stock=>{
      if (stock.stock==stockToSearch.symbol){
        return
      }
      else{
        stocks.push({'stock':stockToSearch.symbol,'price':stockToSearch.latestPrice,'likes':0})
      }
    })
  }else{
    stocks.push({'stock':stockToSearch.symbol,'price':stockToSearch.latestPrice,'likes':0})
  }
    return
  }

  async function addLike(stockToLike,ipToCheck){
    let toBeReturned=false
    ip_list.forEach(ip=>{
      if(checkIP(ipToCheck)){
        toBeReturned=true
    }
    })
    if(!toBeReturned){
      stocks.forEach(stock=>{
        if (stock.stock==stockToLike.symbol){
          stock.likes=stock.likes+1
          registerIP(ipToCheck)
          
        }
      })
    }
    
    return
  }

  async function searchForLikes(stockToSearch){
    let likesFounded=0
    if (stocks.length!=0){
      stocks.forEach(stock=>{
        if (stock.stock==stockToSearch.symbol){
          console.log(stock)
          likesFounded=stock.likes
        }
      })
    }else{
      likesFounded=0
    }
    return new Promise(res=>res(likesFounded))
  }

  async function resolutionRoute1(stockToReturn){
    const resultLike=(await searchForLikes(stockToReturn))
    stockToReturn["likes"]=resultLike
    return new Promise(res=>res({'stockData':{"stock":stockToReturn['symbol'],"price":stockToReturn['latestPrice'],"likes":stockToReturn['likes']}}))
  }

  async function resolutionRoute2(stockToReturn1,stockToReturn2){
    let stockDataToReturn={}

    stockDataToReturn=[{"stock":stockToReturn1['stock'],"price":stockToReturn1['price'],"rel_likes":stockToReturn1['rel_likes']},{"stock":stockToReturn2['stock'],"price":stockToReturn2['price'],"rel_likes":stockToReturn2['rel_likes']}]
    let responseToReturn={'stockData':stockDataToReturn}
    return new Promise(res=>res(responseToReturn))
  }

  app.route('/api/stock-prices').get(async function (req, res){
    //check how many stocks
    if (numberOfStocks(req.query.stock)=='Evaluate'){
      const stockToCheck=req.query.stock
      const resultStock=await getPrice(stockToCheck)
      await searchCurrentStocks(resultStock)
      if (req.query.like){
        var ipToCheck = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await addLike(resultStock,ipToCheck)
      }
      res.send(await resolutionRoute1(resultStock))
    }
    else if (numberOfStocks(req.query.stock)=='Compare'){
      let stockToCheck1=req.query.stock[0]
      let stockToCheck2=req.query.stock[1]
      const resultStock1=await getPrice(stockToCheck1)
      const resultStock2=await getPrice(stockToCheck2)
      if (req.query.like){
        var ipToCheck = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await addLike(resultStock1,ipToCheck)
        await addLike(resultStock2,ipToCheck)
      }
      resultStock1["stock"]=resultStock1['symbol']
      resultStock1["price"]=resultStock1['latestPrice']
      resultStock2["stock"]=resultStock2['symbol']
      resultStock2["price"]=resultStock2['latestPrice']
      const resultLike1=(await searchForLikes(resultStock1))
      resultStock1["likes"]=resultLike1
      const resultLike2=(await searchForLikes(resultStock2))
      resultStock2["likes"]=resultLike2
      resultStock1['rel_likes']=resultStock1['likes']-resultStock2['likes']
      resultStock2['rel_likes']=resultStock1['likes']-resultStock2['likes']
      res.send(await resolutionRoute2(resultStock1,resultStock2))
    }
  
  });
  function registerIP(ipToRegister){
    ip_list.push(ipToRegister)
    //bcrypt.hash(ipToRegister, 1, function(err, hash) {
    //  ip_list.push(hash)
    //});  
    return
  }

  function checkIP(ipToCheck){
    let toBeReturned=false
      ip_list.forEach((ip)=>{
      if(ip==ipToCheck){
        toBeReturned=true
      }
      //bcrypt.compare(ipToCheck, hashedIP, function(err, result) {
      //  return true
      });
      return toBeReturned
    }

};


function numberOfStocks(stockArray){
  if (Array.isArray(stockArray)){
    return 'Compare'
  } else {
    return 'Evaluate'
  }
}