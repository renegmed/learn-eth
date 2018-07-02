var ChainList = artifacts.require("./ChainList.sol")

// test suite
contract('ChainList', function(accounts){
    var chainListInstance;
    var seller = accounts[1];
    var articleName = "article 1";
    var articleDescription = "Description for article 1";
    var articlePrice = 10;

    it("should be initialized with empty values", function(){
        return ChainList.deployed().then(function(instance){
            return instance.getArticle();
        }).then(function(data){
            console.log("-----------------")
            console.log("data[0]=", data[0]);
            console.log("-----------------")
            assert.equal(data[0], 0x0, "seller must be empty");
            assert.equal(data[1], "", "article name must be empty");
            assert.equal(data[2], "", "article description must be empty");
            assert.equal(data[3].toNumber(), 0, "article price must be zero");
        });
    });

    it("should sell an article", function() {
        return ChainList.deployed().then(function(instance){
            chainListInstance = instance;
            return chainListInstance.sellArticle(
                articleName, articleDescription, web3.toWei(articlePrice,"ether"), {from: seller});
        }).then(function(){
            return chainListInstance.getArticle();
        }).then(function(data){
            console.log("-----------------")
            console.log("data[0]=", data[0]);
            console.log("data[1]=", data[1]);
            console.log("-----------------")
            assert.equal(data[0], seller, "seller must be " + seller);
            assert.equal(data[1], articleName, "article name must be " + articleName);
            assert.equal(data[2], articleDescription, "article description must be " + articleDescription);
            assert.equal(data[3].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + articlePrice);
        });
    });
}); 