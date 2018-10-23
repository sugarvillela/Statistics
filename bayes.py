# I'm not fluent in Python, which explains why this code looks like C without brackets
import numpy as np

def loadsparsedata():#x1 x2 x3 y
    X=[#cloudy=0, reining=1, sunny=2
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
    Y=[0,0,1,0,0,1,1,0,1,0];
    return ( X, Y )
    
def addToSet( d, addMe ):
    d[addMe] = d[addMe]+1 if ( addMe in d ) else 1;

def initClasses( list ):
    classes={};
    for i in range( len(list) ):
        addToSet( classes, list[i] );
    return classes;

def initFeatList( X ):
    #Create list: size = number of features in trainX
    #each element to show number of occurrences of that feat in trainX
    featList=[]
    for j in range( len(X[0]) ):
        curr={};
        for i in range( len(X) ):
            addToSet( curr, X[i][j] );
        featList.append( curr );
    return featList;

def trainnaivebayes( trainX, trainY ):
    featList=initFeatList( trainX );
    print( 'featList' );
    print( featList );
    classes=initClasses( trainY );
    print( 'classes' );
    print( classes );
    table=[];
    for h in range( len(classes) ):#h=class
        table.append([]);
        for i in range( len(featList) ):#i=x1, x2, ....
            curr=[];
            for j in range( len(featList[i]) ):#j=state
                curr.append(0)
                for k in range( len(trainX) ):#k=example from list  
                    if trainX[k][i]==j and trainY[k]==h :
                        curr[j]+=1;
                curr[j]=curr[j]/classes[h];
            
            table[h].append( curr );
        
    
    return ( classes, table );

def naivebayesclass( X, model ):
    classes=model[0];
    table=model[1];
    tally=[];
    listLen=sum( classes.values() );
    for h in range( len(classes) ):#h=class
        #init class tally with p(class=h)
        tally.append( classes[h]/listLen );
        for i in range( len(X) ):#i=x1, x2, ....
            tally[h]*=table[h][i][X[i]]
    print( tally )
    return np.argmax( tally );
    

def main():
    print("python main def");
    (trainX,trainY) = loadsparsedata();
    print( 'trainX' );
    print( trainX );
    print( 'trainY' );
    print( trainY );
    model=trainnaivebayes( trainX, trainY );
    print( 'model' );
    print( model );
    X=[0, 0, 0];
    print( 'optimal class', naivebayesclass( X, model ) );
    X=[1, 1, 0];
    print( 'optimal class', naivebayesclass( X, model ) );
    X=[1, 2, 1];
    print( 'optimal class', naivebayesclass( X, model ) );
    
if __name__ == '__main__':
	main()
