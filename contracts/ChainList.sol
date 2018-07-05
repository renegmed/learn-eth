pragma solidity ^0.4.18;

contract ChainList {
    // state variables
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;

    // events
    event LogSellArticle(
        address indexed _seller,
        string _name,
        uint256 _price
    );

    event LogBuyArticle(
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );
    // // constructor
    // function ChainList() public {
    //     sellArticle("Default article", "This is an article set by default", 10000000000000000000);
    // }
    
    // sell an article
    function sellArticle(string _name, string _description, uint256 _price) public {
        seller = msg.sender;  
        buyer = 0x0;                    
        name = _name;
        description = _description;
        price = _price;        

        emit LogSellArticle(seller, name, price);
    }

    // get an article
    function getArticle() public view returns (
        address _seller,
        address _buyer, 
        string _name, 
        string _description, 
        uint256 _price
    ) {
        return(seller, buyer, name, description, price);

    }

    // buy an article
    function buyArticle() payable public {
        // we check whetehr there is an article for sale
        require(seller != 0x0);

        // we check that the article has not been sold yet
        require(buyer == 0x0);

        // we don't allow the seller to buy his own article
        require(msg.sender != seller);

        // we check that the value sent corresponds to the price of the article
        require(msg.value == price);

        // keep buyer's information
        buyer = msg.sender;

        // the buyer can pay the seller
        seller.transfer(msg.value);

        // trigger the event
        emit LogBuyArticle(seller, buyer, name, price);
    }

}