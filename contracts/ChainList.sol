pragma solidity ^0.4.18;

contract ChainList {
    // customer types
    struct Article {
        uint id;
        address seller;
        address buyer;
        string name;
        string description;
        uint256 price;
    }
 
    // state variables
    address owner;
    mapping (uint => Article) public articles;
    uint articleCounter;

    // events
    event LogSellArticle(
        uint indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );

    event LogBuyArticle(
        uint indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );     
    
    // constructor
    function ChainList() public {
        owner = msg.sender;
    }

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;  // this is a placeholder for the code that modifier is applied to
    }

    // deactivate the contract
    function kill() public onlyOwner { 
        selfdestruct(owner);
    }

    // sell an article
    function sellArticle(string _name, string _description, uint256 _price) public {
        // a new article
        articleCounter++;

        // store this article
        articles[articleCounter] = Article(
            articleCounter,
            msg.sender,
            0x0,
            _name,
            _description,
            _price
        );
          
        emit LogSellArticle(articleCounter, msg.sender, _name, _price);
    }

    // fetch  the number of articles in the contract
    function getNumberOfArticles() public view returns (uint) {
        return articleCounter;
    }

    // fetch and return all article IDs for articles still for sale
    function getArticlesForSale() public view returns (uint[]) {
        // prepare output array. array is placed in memory instead in a blockchain storage (would cost a gas) 
        uint[] memory articleIds = new uint[](articleCounter);

        uint numberOfArticlesForSale = 0;

        // iterate over articles. i = 1 because articleCounter started with 1
        for(uint i = 1; i <= articleCounter; i++) {
            // keep the ID if the article is still for sale
            if(articles[i].buyer == 0x0) {  // no buyer yet
                articleIds[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++;
            }
        }

        // copyt the articleIds array into a smaller forSale array
        uint[] memory forSale = new uint[](numberOfArticlesForSale);
        for (uint j = 0; j < numberOfArticlesForSale; j++) {
            forSale[j] = articleIds[j];
        }

        return forSale;
    }     

    // buy an article
    function buyArticle(uint _id) payable public {
        // we check whether there is an article for sale
        require(articleCounter > 0);

        // we check that the article exists
        require(_id > 0 && _id <= articleCounter);

        // we retrieve the article
        Article storage article = articles[_id];

        // we check that the article has not been sold yet
        require(article.buyer == 0x0);

        // we don't allow the seller to buy his own article
        require(msg.sender != article.seller);

        // we check that the value sent corresponds to the price of the article
        require(msg.value == article.price);

        // keep buyer's information
        article.buyer = msg.sender;

        // the buyer can pay the seller
        article.seller.transfer(msg.value);

        // trigger the event
        emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
    }

}