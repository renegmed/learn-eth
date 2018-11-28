const ChainList = artifacts.require('ChainList'); 
 
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('ChainList', (accounts) => {

    let chainList;
    const owner = accounts[0];

    const SELLER_1 = accounts[1];
    const SELLER_2 = accounts[2];
    const BUYER_1 = accounts[3];
    const BUYER_2 = accounts[4];
    const BUYER_3 = accounts[5];

    const ARTICLE_NAME = "First Article";
    const ARTICLE_DESCRIPTION = "The first article printed for sale.";
    const ARTICLE_PRICE = 15;

    const ARTICLE_NAME_2 = "Second Article";
    const ARTICLE_DESCRIPTION_2 = "The second article printed for sale.";
    const ARTICLE_PRICE_2 = 25;

    beforeEach(async () => {
        chainList = await ChainList.new({from: owner});
    });

    afterEach(async () => {
        await chainList.kill({from: owner});
    });

    it("should be initialized with empty values", async () => {
    
        const numOfArticles = await chainList.getNumberOfArticles();
        assert.equal(numOfArticles.toNumber(), 0, "number of articles must be zero.");

        const numOfArticlesForSale = await chainList.getArticlesForSale()
        assert.equal(numOfArticlesForSale.length, 0, "there shouldn't be any article for sale."); 

    });


    it("should let us sell a first article", async () => { 

        let tx = await chainList.sellArticle(  // returns LogSellArticle event
            ARTICLE_NAME, 
            ARTICLE_DESCRIPTION, 
            web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_1}
        );    
         
        truffleAssert.eventEmitted(tx, 'LogSellArticle', (ev) => { 
            // console.log(ev._id.toNumber());
            // console.log(ev._name);
            // console.log(ev._seller);
            // console.log(web3.fromWei(ev._price,"ether").toNumber());            
            return ev._id.toNumber() == 1 && 
                ev._seller === SELLER_1 &&
                ev._name === ARTICLE_NAME && 
                web3.fromWei(ev._price,"ether").toNumber() === ARTICLE_PRICE //> 4.902855668086734e+76  //web3.toWei(ARTICLE_PRICE,"ether")
            ;
        }, "LogSellArticle should have been emitted.");
 
        const numOfArticles = await chainList.getNumberOfArticles();
        assert.equal(numOfArticles.toNumber(), 1, "number of articles must be 1.");
        
        const articlesForSale = await chainList.getArticlesForSale()
        assert.equal(articlesForSale.length, 1, "Should have 1 article for sale.");
        
        const articleForSale = await chainList.articles(articlesForSale[0]);
        assert.equal(articleForSale[0].toNumber(),1, "article id must be 1");
        assert.equal(articleForSale[1], SELLER_1, "seller must be " + SELLER_1);
        assert.equal(articleForSale[2], 0x0, "buyer must be empty");
        assert.equal(articleForSale[3], ARTICLE_NAME, "article name must be " + ARTICLE_NAME);
        assert.equal(articleForSale[4], ARTICLE_DESCRIPTION, "article description must be " + ARTICLE_DESCRIPTION);
        assert.equal(articleForSale[5].toNumber(), web3.toWei(ARTICLE_PRICE, "ether"), "article price must be " + web3.toWei(ARTICLE_PRICE, "ether"));
         
    });
 
    it("should buy an article", async () => { 
        let tx = await chainList.sellArticle(   
            ARTICLE_NAME, 
            ARTICLE_DESCRIPTION, 
            web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_1}
        );  

        tx = await chainList.sellArticle(   
            ARTICLE_NAME_2, 
            ARTICLE_DESCRIPTION_2, 
            web3.toWei(ARTICLE_PRICE_2,"ether"), {from: SELLER_1}
        );
            

        let numOfArticles = await chainList.getNumberOfArticles();
        assert.equal(numOfArticles.toNumber(), 2, "number of articles must be 2.");
        
        let articlesForSale = await chainList.getArticlesForSale()
        assert.equal(articlesForSale.length, 2, "Should have 2 articles for sale.");

        const sellerBalanceBeforeBuy = await web3.fromWei(web3.eth.getBalance(SELLER_1), "ether").toNumber();
        const buyerBalanceBeforeBuy = await web3.fromWei(web3.eth.getBalance(BUYER_2), "ether").toNumber();
        
        tx = await chainList.buyArticle(
            1, {
                from: BUYER_2,
                value: web3.toWei(ARTICLE_PRICE, "ether")
            }
        );
        truffleAssert.eventEmitted(tx, 'LogBuyArticle', (ev) => {  
            return ev._id.toNumber() == 1 && 
                ev._seller === SELLER_1 && 
                ev._buyer === BUYER_2 && 
                ev._name === ARTICLE_NAME && 
                web3.fromWei(ev._price,"ether").toNumber() === ARTICLE_PRICE  
            ;
        }, "LogBuyArticle event should have been emitted.");

        // record balances of buyer and seller after the buy
        const sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(SELLER_1), "ether").toNumber();
        const buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(BUYER_2), "ether").toNumber();

        // check the effect of buy on balances of buyer and seller, accounting for gas
        assert.isTrue(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + ARTICLE_PRICE, 
            "seller should have account balance of " + (sellerBalanceBeforeBuy + ARTICLE_PRICE) + " ETH, not " + 
            sellerBalanceAfterBuy + " ETH.");
        assert.isTrue(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - ARTICLE_PRICE, "buyer should have spent " + ARTICLE_PRICE + " ETH");

        numOfArticles = await chainList.getNumberOfArticles();
        assert.equal(numOfArticles.toNumber(), 2, "number of articles must be 2.");
        
        articlesForSale = await chainList.getArticlesForSale()
        assert.equal(articlesForSale.length, 1, "Should only 1 article left for sale."); 
    });

    it("should not allow to buy an article when there is no article for sale yet", async () => {
        try {  
            await chainList.buyArticle(
                1, {
                    from: BUYER_1,
                    value: web3.toWei(ARTICLE_PRICE, "ether")
                }
            );
            assert.fail("Should throw a revert()");
        } catch (err) {
            assert.ok(/revert/.test(err.message));
        }
    }); 
    
    it("should not allow to buy an article that does not exist", async () => {
        try {  
            await chainList.sellArticle(   
                ARTICLE_NAME, 
                ARTICLE_DESCRIPTION, 
                web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_1}
            );  
            
            await chainList.buyArticle(
                2, {
                    from: BUYER_1,
                    value: web3.toWei(ARTICLE_PRICE, "ether")
                }
            );
            
            assert.fail("Should throw a revert()");
        } catch (err) { 
            assert.ok(/revert/.test(err.message));
        }
    });
    
    it ("should not allow you to buy your own article", async () => {
        try {  
            await chainList.sellArticle(   
                ARTICLE_NAME, 
                ARTICLE_DESCRIPTION, 
                web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_1}
            );  
            
            await chainList.buyArticle(
                1, {
                    from: SELLER_1,
                    value: web3.toWei(ARTICLE_PRICE, "ether")
                }
            ); 
            assert.fail("Should throw a revert()");
        } catch (err) {
            //console.log(err);
            assert.ok(/revert/.test(err.message));
        }
    });
    
    it("should not allow you try to buy an article for a value different from its price", async () => {
        try {  
            await chainList.sellArticle(   
                ARTICLE_NAME, 
                ARTICLE_DESCRIPTION, 
                web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_1}
            );  
            
            await chainList.buyArticle(
                1, {
                    from: BUYER_3,
                    value: web3.toWei(ARTICLE_PRICE+1, "ether")
                }
            ); 
            assert.fail("Should throw a revert()");
        } catch (err) {
            //console.log(err);
            assert.ok(/revert/.test(err.message));
        }
    });
    
    
    it("should not allow to buy an article that has already been sold", async () => {
        try {  
            await chainList.sellArticle(   
                ARTICLE_NAME, 
                ARTICLE_DESCRIPTION, 
                web3.toWei(ARTICLE_PRICE,"ether"), {from: SELLER_2}
            );  
            
            await chainList.buyArticle(
                1, {
                    from: BUYER_3,
                    value: web3.toWei(ARTICLE_PRICE, "ether")
                }
            ); 
            await chainList.buyArticle(
                1, {
                    from: BUYER_1,
                    value: web3.toWei(ARTICLE_PRICE, "ether")
                }
            ); 
            assert.fail("Should throw a revert()");
        } catch (err) {
            //console.log(err);
            assert.ok(/revert/.test(err.message));
        }
    });
    
    
});