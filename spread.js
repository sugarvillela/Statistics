/* The most basic job of statistics is to list attributes of a dataset 
 * This code sorts data, sums it, finds the mean, the median, standard
 * deviations, quartiles and outliers.  There is also a crude histogram-like
 * function for seeing skews etc.  */
function numSort( arr ){
    /* js does alpha sort; this is how you get it to sort numbers */
    arr.sort(
        function (a,b) {
            return a - b;
        }
    );
}
function sumOfValues( arr, obj ){
    var sum=0;
    for( var i=0;i<arr.length; i++ ){
        sum+=arr[i];
    }
    obj.sum=sum;
}
function avg( obj ){
    obj.mean=obj.sum/obj.size;
}
function sumOfSquares( arr, obj ){
    /* Sometimes you need components of Standard Deviation */
    var sum=0;
    for( var i=0;i<arr.length; i++ ){
        sum+=arr[i]*arr[i];
    }
    obj.sumOfSquares=sum;
}
function variance( arr, obj ){
    var curr, sum=0;
    for( var i=0;i<arr.length; i++ ){
        curr=arr[i]-obj.mean
        sum+=curr*curr;
    }
    obj.variance=sum/(arr.length-1);
}
function variance_method2( obj ){
    /* Implements the short formula; gives same answer as previous function */
    obj.s2=
        ( obj.sumOfSquares-( obj.sum*obj.sum )/obj.size )/(obj.size-1);
}
function standardDev( obj ){
    obj.s=Math.sqrt( obj.variance );
}
function med( arr ){
    var len=arr.length;
    if( len%2>0 ){//odd
        return arr[( (len+1)/2 )-1];
    }
    else{//even
        return ( arr[(len/2)-1] + arr[len/2] )/2;
    }
}
function quartiles( arr, obj ){
    /* Different conventions for including the median
     * It only makes a different in small sets */
    var includeMedian=true;
    var len=arr.length;
    var mid=( includeMedian )? Math.ceil( len/2 ) : Math.floor( len/2 );
    obj.q1=med( arr.slice( 0, mid ) );
    obj.q2=med( arr );
    obj.q3=med( arr.slice( len-mid ) );
}
function outliers( arr, obj ){
    var iqr=obj.q3-obj.q1;
    var lf=obj.q1-1.5*iqr, llf=obj.q1-3*iqr, uf=obj.q3+1.5*iqr, uuf=obj.q3+3*iqr;
    for( var i=0;i<arr.length; i++ ){
        if( arr[i]<llf ){
            obj.xOutlier1.push( arr[i] )
        }
        else if( arr[i]<=lf ){
            obj.outlier1.push( arr[i] )
        }
        else if( arr[i]>uuf ){
            obj.xOutlier2.push( arr[i] )
        }
        else if( arr[i]>uf ){
            obj.outlier2.push( arr[i] )
        }
        else {
            obj.trimmed.push( arr[i] )
        }
    }
}
function spreadToObj( arr ){
    var obj={
        size: arr.length,
        min: arr[0],
        max: arr[arr.length-1],
        sum: 0,
        mean: 0,
        variance: 0,
        sumOfSquares: 0,
        s: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        xOutlier1: [],
        outlier1: [],
        trimmed: [],
        outlier2: [],
        xOutlier2: []
    }
    /* Some of these access values set by previous, so they may need to be
     * called in this order */
    sumOfValues( arr, obj );
    avg( obj );
    sumOfSquares( arr, obj );
    variance( arr, obj );
    standardDev( obj );
    variance_method2( obj );
    quartiles( arr, obj );
    outliers( arr, obj );
    return obj;
}
function handleTextArea(){
    var arr = document.getElementById('textIn').value.split(/[^0-9\-\.]+/);
    var precision=3
    for( var i=0;i<arr.length; i++ ){
        arr[i]=parseFloat( arr[i].trim() );
    }
    if( arr.length<2 ){
        document.getElementById('attr').innerHTML='Empty';
        return;
    }
    numSort( arr );
    var obj=spreadToObj( arr );
    basicHist( arr, setClassSize( obj ) );
//        console.log( 'result: ' );
//        console.log( 
//            'Size='+obj.size+
//            ', Min='+obj.min+
//            ', Max='+obj.max+
//            ', Sum='+obj.sum+
//            ', Mean='+obj.mean+
//            ', SumOfSquares='+obj.sumOfSquares+
//            ', s^2='+obj.variance+
//            ', s='+obj.s+
//            ', s2='+obj.s2+
//            'q1='+obj.q1+
//            ', q2='+obj.q2+
//            ', q3='+obj.q3+
//            ', Extreme Low:='+obj.xOutlier1.join(' ')
//        );
    document.getElementById('sorted').innerHTML=arr.join(' ');//'<br>'
    document.getElementById('attr').innerHTML=
        'Size='+obj.size+
        ', Min='+obj.min+
        ', Max='+obj.max+
        ', Sum='+obj.sum+
        ', Mean='+obj.mean.toFixed( precision )+
        ', Median='+obj.q2.toFixed( precision )+
        '<br>SumOfSquares='+obj.sumOfSquares.toFixed( precision )+
        ', s^2='+obj.variance.toFixed( precision )+
        ', s='+obj.s.toFixed( precision )+
        ', s2='+obj.s2.toFixed( precision )+
        '<br>q1='+obj.q1.toFixed( precision )+
        ', q2='+obj.q2.toFixed( precision )+
        ', q3='+obj.q3.toFixed( precision );
    var a,b,c,d,e;
    a=(obj.xOutlier1.length)? obj.xOutlier1.join(' ')+' <br/>': 'No Extreme<br/>';
    b=(obj.outlier1.length)? obj.outlier1.join(' ')+' <br/>': 'No Low<br/>';
    c=obj.trimmed.join(' ')+' <br/>';
    d=(obj.outlier2.length)? obj.outlier2.join(' ')+' <br/>': 'No High<br/>';
    e=(obj.xOutlier2.length)? obj.xOutlier2.join(' ')+' <br/>': 'No Extreme<br/>';
    document.getElementById('outliers').innerHTML=a+b+c+d+e;
}
function setClassSize( obj ){
    /* Due to an issue with js floating point representation, the minimum
     * class size is one, even for ranges less than one.  JS adds .1 + .1 and
     * comes up with 0.20000000000000001 or 0.19999999999999999, which breaks
     * the histogram function. I didn't make a workaround */
    var range=obj.max-obj.min;
    for( var i=10, j=1;i<2147483648; i*=10, j*=10 ){
        if( range< i ){
            return j;
        };
    }
    return j; 
}
function basicHist( arr, classSize ){
    /* More like a stem-and-leaf, but with all values displayed  */
    var div=document.getElementById('histo');
    div.innerHTML='';
    var groups=groupByClass( arr, classSize );
    var text, tr, table=document.createElement('table');
    table.className='table';
    for( var i=groups.height-1;i>=0; i-- ){
        tr=document.createElement('tr');
        for( var j=groups.start;j<groups.end; j+=classSize ){
            text=groups[j][i]===false? '.' : groups[j][i];
            tr.appendChild( tdText( text ) )
        }
        table.appendChild( tr );
    }
    tr=document.createElement('tr');
    for( var j=groups.start;j<groups.end; j+=classSize ){
        tr.appendChild( tdText( '_' ) );
    }
    table.appendChild( tr );
    tr=document.createElement('tr');
    for( var j=groups.start;j<groups.end; j+=classSize ){
        tr.appendChild( tdText( j.toString() ) );
    }
    table.appendChild( tr );
    div.appendChild( table );
}
function tdText( text ){//space saver
    var td=document.createElement('td');
    td.appendChild( document.createTextNode( text ));
    return td;
};
function round( val, roundTo ){
    return Math.round( val/roundTo )*roundTo;
}
function groupByClass( arr, classSize ){
    var i, j=0, groups={}, len=arr.length, maxHeight=0, numClasses=0;
    var start=round( arr[0], classSize ),
        end=round( arr[len-1], classSize )+classSize;
    var k=start;
    for( i=start + classSize;i<=end; i+=classSize ){
        groups[k]=[];
        while( j<len && arr[j] < i ){
            groups[k].push( arr[j] );
            j++;
        }
        if( groups[k].length>maxHeight ){
            maxHeight=groups[k].length
        }
        k+=classSize;
        numClasses++;
    }
    groups.start=start;
    groups.end=end;
    groups.height=maxHeight;
    groups.numClasses=numClasses;
    for( k=start;k<end; k+=classSize ){
        for( j=groups[k].length;j<maxHeight; j++ ){
            groups[k].push(false);
        }
    }
    return groups;
}