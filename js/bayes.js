/* Util */
function sumOfValues_2d( arr ){
    var sum=0;
    for( var i=0;i<arr.length; i++ ){
        sum+=sumOfValues( arr[i] );
    }
    return sum;
}
function addToSet( obj, addMe ){
    /* Use an object as a set; ensures every field is unique 
     * Stores number of times a field is added */
    if( obj.hasOwnProperty( addMe ) ){
        obj[addMe]+=1;
    }
    else{
        obj[addMe]=1;
    }
}
function loadsparsedata(){//x1 x2 x3 y
    /* Mimic a file load operation for training the classifier
     * X is 10 examples, three features each 
     * Y is the output data: 10 results */
    var X=[//cloudy=0, reining=1, sunny=2
        [0,2,0],
        [0,2,1],
        [0,0,1],
        [1,2,0],
        [0,1,0],
        [0,1,1],
        [1,0,1],
        [0,2,0],
        [1,2,0],
        [0,0,0]
    ];
    var Y=[0,0,1,0,0,1,1,0,1,0];
    return {trainX:X, trainY:Y}
}

function initClasses( list ){
    var classes=[];
    for( var i=0; i<list.length; i++){
        addToSet( classes, list[i] );
    }
    return classes;
}
function initFeatList( list ){
    //Create list: size = number of features in trainX
    //each element to show number of occurrences of that feat in trainX
    var featList=[], curr;
    for(var j=0; j<list[0].length; j++){
        curr={};
        for(var i=0; i<list.length; i++){
            addToSet( curr, list[i][j] );
        }
        featList.push( curr );
    }
    return featList;
}
function setModel( trainX, trainY ){
    /* Set model from training data. Once you have model set, reuse it for
     * each test or application */
    var classes=initClasses( trainY ); 
    var featList=initFeatList( trainX );
//    console.log( 'featList' );
//    console.log( featList );
    var table=[], curr;
    /* This looks ugly, but there are fewer classes/features than examples. 
     * h i and j are small numbers; only k is large */    
    for( var h in classes ){//h=class
        table[h]=[];
        for( var i in featList ){//i=x1, x2, ....
            curr={};
            for( var j in featList[i] ){//j=state
                curr[j]=0;
                for( var k in trainX ){
                    if( trainX[k][i]==j && trainY[k]==h ){
                        curr[j]+=1;
                    }
                }
                curr[j]=curr[j]/classes[h];
            }
            table[h][i]=curr;
        }
    }
    return [ classes, table ];
}
function bestClass( X, model ){
    /* Uses the model to predict values for Y. Use this with test data */
    var classes=model[0];
    var table=model[1];
    var tally=[];
    var listLen=sumOfValues( classes );
    for( var h in classes ){//h=class
        /* init class tally with p(class=h) */
        tally[h]=classes[h]/listLen;
        for( var i in X ){//i=x1, x2, ....
            tally[h]*=table[h][i][X[i]]
        }
    }
//    document.write( 'tally' )
//    document.write( tally )
    /* Tally contains scalar values; choose highest value as best class */
    return maxIndex( tally );
}

function zeros( rows, cols ){//return 1- or 2-d array of given size
    if( cols===undefined ){ cols=0; }
    var arr=[], curr;
    for(var i=0; i<rows; i++){
        if( cols ){
            curr=[];
            for(var j=0; j<cols; j++){
                curr.push( 0 );
            }
            arr.push( curr );
        }
        else{
            arr.push( 0 );
        }
    }
    return arr;
}
function sumOfValues( arr ){
    var sum=0;
    for( var i=0;i<arr.length; i++ ){
        sum+=arr[i];
    }
    return sum;
}
function maxIndex( nums ){//return index of max value
    var best=-1, besti=-1;
    for( var i in nums ){//h=class
        if( nums[i]>best ){
            best=nums[i];
            besti=i;
        }
    }
    return besti;
}
function dispModel( model ){
    /* Model is array of arrays */
    var classes=model[0];
    var table=model[1];
    document.write( classes.length+' Classes<br>' )
    document.write( 'Class Frequencies:<br>' )
    document.write( classes )
    document.write( '<br><br>' )

    for( var h in classes ){//h=class
        document.write( '<b>Probabilities of feature states given class '+h+':</b><br>' )
        for( var i in table[h] ){
            document.write( 'Feature '+i+' has '+Object.keys(table[h][i]).length+' states<br>')
            console.log(table[h][i])
            for( var j in table[h][i] ){//i=x1, x2, ....
                document.write( 'Feature '+i+', State '+j+'<br>' )
                document.write( table[h][i][j] )
                document.write( '<br>' )
            }
            document.write( '<br>' )
        }
        //document.write( 'Classes with <br>' )
        document.write( '<br>' )
    }
}
function go(){
    var obj=loadsparsedata();
    var trainX=obj.trainX, 
        trainY=obj.trainY;
    document.write( '<b>TrainX: </b><br>' );
    document.write( trainX.length+' Cases, '+trainX[0].length+' Features<br>')
    document.write( 'Number of states per feature is highest number of that column<br>')
    for( var i in trainX ){
        document.write( trainX[i] ); 
        document.write( '<br>' );
    }
    document.write( '<br><b>TrainY</b><br>' );
    document.write( 'Number of classes is highest number in list<br>')
    document.write( trainY.length+' Cases<br>')
    document.write( trainY );
    document.write( '<br><br>' );
    
    var model=setModel( trainX, trainY );
    document.write( '<b>Resulting Model:</b><br>' );
    dispModel( model );
    document.write( '<br>' );
    /* The test data: */
    var X;
    X=[0, 0, 0];
    document.write( '<b>For X=[0, 0, 0]</b><br>Best Class ='+bestClass( X, model )+'<br>' );
    X=[1, 1, 0];
    document.write( '<b>For X=[1, 1, 0]</b><br>Best Class ='+bestClass( X, model )+'<br>' );
    X=[1, 2, 1];
    document.write( '<b>For X=[1, 2, 1]</b><br>Best Class ='+bestClass( X, model )+'<br>' );

    document.write( 'Try it with different training and test values<br>');
    document.write( '(You need to edit the source code to chang the input values)<br>');

}
