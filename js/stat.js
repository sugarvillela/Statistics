/* The most basic job of statistics is to list attributes of a dataset 
 * This code sorts data, sums it, finds the mean, the median, standard
 * deviations, quartiles and outliers.  There is also a crude histogram-like
 * function for seeing skews etc.  */
//Array.prototype.elem=function( i ){//works as long as data is not false
//    return ( i<this.length )? this[i] : false; 
//}
var POP_OPEN;/* Name of currently open window or false*/
var NEXT_DIST/* Name of selected distribution tool handler */
String.prototype.charIsWS=function(){//
    return ( this.valueOf().charCodeAt(0)<33 );//misses DEL key 127
};
var Err=new function(){
    this.list=[];
    this.add=function( err ){//add to cumulative err list
        this.list.push( err );
    }
    this.isErr=function(){//true if errors since last display
        return this.list.length>0;
    }
    this.disp=function(){//display all errors since last display
        if( this.list.length ){
            document.getElementById('errContent').innerHTML=this.list.join('<br>');
            this.list=[];
            popOpen('pop_err');
            return true;
        }
        return false;
    }
    this.alert=function( err ){//instant display of current error
        document.getElementById('errContent').innerHTML=err;
        popOpen('pop_err');
    }     
}
var Getter=new function(){
    /* For splitting up sets with | */
    this.textToArr=function ( text ){//splits on whitespace or comma; separates '|'
        var len=text.length, state=0, lastState=2, arr=[], i, j=-1;
        for( i=0;i<len; i++ ){
            if( text[i].charIsWS() || text[i]==',' ){
                state=1;
            }
            else if( text[i]==='|' ){
                j++;
                arr[j]='|';
                lastState=2;
                continue;
            }
            else{
                state=0;
            }
            if( state===0 ){
                if( state!==lastState ){
                    j++;
                    arr[j]='';
                }
                arr[j]+=text[i];
            }
            lastState=state;
        }
        return arr;
    }
    this.arrToNumArr=function( arr ){//make sure only num and dot are in array
        for( var i=0;i<arr.length; i++ ){
            arr[i]=parseFloat( arr[i].trim() );
            if( isNaN( arr[i] ) ){
                Err.add( 'Non-numeric data found' );
            }
        }
    }
    this.arrSplitOnChar=function( arr ){
        var len=arr.length, out=[], i, j=0;
        out[0]=[];
        for( i=0;i<len; i++ ){
            if( arr[i]==='|' ){
                if( i ){//ignore bad input: '|' as first element
                    j++;
                    out[j]=[];
                }
            }
            else{
                out[j].push( arr[i] );
            }
        }
        return out;
    }
    this.textToPairs=function ( text ){//splits on whitespace or comma; separates '|'
        var len=text.length, state=0, lastState=2, arr=[], i, j=-1;
        for( i=0;i<len; i++ ){
            state=( text[i].charIsWS() || text[i]==',' )? 1 : 0;
            if( state===0 ){
                if( state!==lastState ){
                    j++;
                    arr[j]='';
                }
                arr[j]+=text[i];
            }
            lastState=state;
        }
        return arr;
    }
    /* Text fields with validation and error setting */
    this.rule={
        number:true, nonNeg:true, rangeLo:false, rangeHi:false
    }
    this.setRule=function( key ){//pass key,val or just key
        this.rule[key]=( arguments.length>1 )? arguments[1] : true;
    }
    this.ok=function( val, err ){
        /* Here, apply general rules for all inputs */
        if( this.rule.number && isNaN( val ) ){
            Err.add( err+': Not a number' );
            return false;
        }
        if( this.rule.nonNeg && val<0 ){
            Err.add( err+': Negative number' );
            return false;
        }
        if( this.rule.rangeLo!==false && val<this.rule.rangeLo ){
            Err.add( err+': Number less than ' + this.rule.rangeLo );
            return false;
        }
        if( this.rule.rangeHi!==false && val>this.rule.rangeHi ){
            Err.add( err+': Number greater than ' + this.rule.rangeHi );
            return false;
        }
        return true;
    }
    this.getInt=function( id ){
        var val=document.getElementById( id ).value;
        /* Default or custom error message */
        var err=( arguments.length>1 )? 
            arguments[1]+': '+val : 
            'Input error: '+val;
        /* Abort on empty field */
        if( !val.length ){
            Err.add( err+'Empty' );
            return false;
        }
        if( val.indexOf('.')!=-1 ){
            Err.add( err+': Not Integer' );
            return false;
        }
        val=parseInt( val );
        return( this.ok( val, err ) )? val:false; 
    }
    this.getFloat=function( id ){
        var val=document.getElementById( id ).value;
        /* Default or custom error message */
        var err=( arguments.length>1 )? 
            arguments[1]+': '+val : 
            'Input error: '+val;
        /* Abort on empty field */
        if( !val.length ){
            Err.add( err+'Empty' );
            return false;
        }
        val=parseFloat( val );
        return( this.ok( val, err ) )? val:false;
    }    
    this.get0to1=function( id ){
        var val=document.getElementById( id ).value;
        /* Default or custom error message */
        var err=( arguments.length>1 )? 
            arguments[1]+': '+val : 
            'Input error: '+val;
        /* Abort on empty field */
        if( !val.length ){
            Err.add( err+'Empty' );
            return false;
        }
        val=parseFloat( val );
        if( !this.ok( val, err ) ){//general error
            return false;
        }
        if( val>1 || val< 0 ){//range error
            Err.add( err+': Between 0 and 1?' );
            return false;
        }
        return val;
    }
    this.getRange=function( id ){
        var val=document.getElementById( id ).value.trim();
        /* Default or custom error message */
        var err=( arguments.length>1 )? 
            arguments[1]+': '+val : 
            'Input error: '+val;
        /* Abort on empty field */
        if( !val.length ){
            Err.add( err+'Empty' );
            return false;
        }
        /* Handle number or range */
        var range=val.split("-");
        range[0]=parseInt( range[0] );
        if( range.length===1 ){
            range.push( range[0] );
        }
        else if( range.length===2 ){
            range[1]=parseInt( range[1] );
            if( range[0]>range[1] ){
                Err.add( err+': Invalid Range' );
                return false;
            }
        }
        else{
            Err.add( err+': Invalid Range' );
            return false;
        }
        return( this.ok( range[0], err ) && this.ok( range[1], err ) )? 
            range : false;
    }
}
var Widget=new function(){
    /* Display */
    this.valToHTML=function( val, id ){
        document.getElementById( id ).innerHTML=val;
    }
    this.arrToHTML=function( arr, id ){
        document.getElementById( id ).innerHTML=
            ( arr.length )? arr.join(' ') : '---';
    }
    this.arrToHTML_2d=function( arr, id ){
        var out='';
        for( var i=0;i<arr.length; i++ ){
            out+=i+' = [';
            out+=( arr[i].length )? arr[i].join(' ')+']<br>' : ']<br>';
        }
        document.getElementById( id ).innerHTML=out;
    }
    this.getDL=function( id ){
        var out=document.createElement( "DL" );
        out.className="dl-horizontal";
        if( id!==undefined ){out.id=id;}
        return out;
    }
    this.addKeyVal_dl=function( dl, key, val ){  
        var dt=document.createElement( "DT" ), dd=document.createElement( "DD" );
        dt.appendChild( document.createTextNode( key ) );
        dd.appendChild( document.createTextNode( val ) );
        dl.appendChild( dt );
        dl.appendChild( dd );
    }
    this.tdText=function( text ){//space saver
        var td=document.createElement('td');
        td.className='text-center';
        td.appendChild( document.createTextNode( text ));
        return td;
    };
    this.thText=function( text ){//space saver
        var td=document.createElement('th');
        td.className='text-center';
        td.appendChild( document.createTextNode( text ));
        return td;
    };
}
var Stat=new function(){
    this.numSort=function( arr ){
        /* js does alpha sort; this is how you get it to sort numbers */
        arr.sort(
            function (a,b) {
                return a - b;
            }
        );
    }
    this.sumOfValues=function( arr, obj ){
        obj.sum=0;
        for( var i=0;i<arr.length; i++ ){
            obj.sum+=arr[i];
        }
    }
    this.avg=function( obj ){
        obj.mean=obj.sum/obj.size;
    }
    this.sumOfSquares=function( arr, obj ){
        /* Sometimes you need components of Standard Deviation */
        obj.sumOfSquares=0;
        for( var i=0;i<arr.length; i++ ){
            obj.sumOfSquares+=arr[i]*arr[i];
        }
    }
    this.variance=function( arr, obj ){
        var curr, sum=0;
        for( var i=0;i<arr.length; i++ ){
            curr=arr[i]-obj.mean
            sum+=curr*curr;
        }
        obj.variance=sum/(arr.length-1);
    }
    this.variance_method2=function( obj ){
        /* Implements the short formula; gives same answer as previous function */
        obj.s2=
            ( obj.sumOfSquares-( obj.sum*obj.sum )/obj.size )/(obj.size-1);
    }
    this.standardDev=function( obj ){
        obj.s=Math.sqrt( obj.variance );
    }
    this.med=function( arr ){
        var len=arr.length;
        if( len%2>0 ){//odd
            return arr[( (len+1)/2 )-1];
        }
        else{//even
            return ( arr[(len/2)-1] + arr[len/2] )/2;
        }
    }
    this.quartiles=function( arr, obj ){
        /* Different conventions for including the median
         * It only makes a different in small sets */
        var includeMedian=true;
        var len=arr.length;
        var mid=( includeMedian )? Math.ceil( len/2 ) : Math.floor( len/2 );
        obj.q1=this.med( arr.slice( 0, mid ) );
        obj.q2=this.med( arr );
        obj.q3=this.med( arr.slice( len-mid ) );
    }
    this.outliers=function( arr, obj ){
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
    this.spreadToObj=function( arr ){
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
        this.sumOfValues( arr, obj );
        this.avg( obj );
        this.sumOfSquares( arr, obj );
        this.variance( arr, obj );
        this.standardDev( obj );
        this.variance_method2( obj );
        this.quartiles( arr, obj );
        this.outliers( arr, obj );
        return obj;
    }
    this.dispAttr=function( obj, id, precision ){
        var dl=Widget.getDL();
        Widget.addKeyVal_dl( dl, 'Size', obj.size );
        Widget.addKeyVal_dl( dl, 'Min', obj.min );
        Widget.addKeyVal_dl( dl, 'Max', obj.max );
        Widget.addKeyVal_dl( dl, 'Sum', obj.sum );
        Widget.addKeyVal_dl( dl, 'Mean', obj.mean.toFixed( precision ) );   
        Widget.addKeyVal_dl( dl, 'SumOfSquares', obj.sumOfSquares.toFixed( precision ) );
        Widget.addKeyVal_dl( dl, 'Variance', obj.variance.toFixed( precision ) );
        Widget.addKeyVal_dl( dl, 'Std Dev', obj.s.toFixed( precision ) );
        Widget.addKeyVal_dl( dl, 'q1', obj.q1.toFixed( precision ) );
        Widget.addKeyVal_dl( dl, 'Median', obj.q2.toFixed( precision ) );
        Widget.addKeyVal_dl( dl, 'q3', obj.q2.toFixed( precision ) );
        var elem=document.getElementById( id );
        elem.innerHTML='';
        elem.appendChild( dl );
    }
    this.dispOutliers=function( obj, id ){
        var dl=Widget.getDL();
        /* List Outliers */
        var a,b,c,d,e;
        a=(obj.xOutlier1.length)? obj.xOutlier1.join(' '): 'None';
        b=(obj.outlier1.length)? obj.outlier1.join(' '): 'None';
        c=obj.trimmed.join(' ');
        d=(obj.outlier2.length)? obj.outlier2.join(' '): 'None';
        e=(obj.xOutlier2.length)? obj.xOutlier2.join(' '): 'None';
        Widget.addKeyVal_dl( dl, 'Extreme Low', a );
        Widget.addKeyVal_dl( dl, 'Low', b );
        Widget.addKeyVal_dl( dl, ' ', c );
        Widget.addKeyVal_dl( dl, 'High', d );
        Widget.addKeyVal_dl( dl, 'Extreme High', e );
        var elem=document.getElementById( id );
        elem.innerHTML='';
        elem.appendChild( dl );
    }
}
var Histo=new function(){
    this.setClassSize=function( arr ){
        /* Due to an issue with js floating point representation, the minimum
         * class size is one, even for ranges less than one.  JS adds .1 + .1 and
         * comes up with 0.20000000000000001 or 0.19999999999999999, which breaks
         * the histogram function. I didn't make a workaround */
        var range=arr[arr.length-1]-arr[0];//assume arr sorted, length>0
        for( var i=10, j=1;i<2147483648; i*=10, j*=10 ){
            if( range< i ){
                return j;
            };
        }
        return j; 
    }
    this.basicHist=function( arr ){
        /* More like a stem-and-leaf, but with all values displayed  */
        var classSize=this.setClassSize( arr );
        var div=document.getElementById('histo');
        div.innerHTML='';
        var groups=this.groupByClass( arr, classSize );
        var i, j, text, tr, tb, tf, table=document.createElement('table');
        table.className='table table-striped';
        tb=document.createElement('tbody');
        for( i=groups.height-1;i>=0; i-- ){
            tr=document.createElement('tr');
            for( j=groups.start;j<groups.end; j+=classSize ){
                text=groups[j][i]===false? ' ' : groups[j][i];
                tr.appendChild( Widget.tdText( text ) )
            }
            tb.appendChild( tr );
        }
        table.appendChild( tb );
        /* Footer */
        tf=table.createTFoot();
        tf.style['border-top']='2px solid black';
        tf.style['font-weight']='bold';
        tr=document.createElement('tr');
        for( j=groups.start;j<groups.end; j+=classSize ){
            tr.appendChild( Widget.tdText( j.toString() ) );
        }
        tf.appendChild( tr );
        table.appendChild( tf );
        div.appendChild( table );
    }
    
    this.round=function( val, roundTo ){
        return Math.round( val/roundTo )*roundTo;
    }
    this.groupByClass=function( arr, classSize ){
        var i, j=0, groups={}, len=arr.length, maxHeight=0, numClasses=0;
        var start=this.round( arr[0], classSize ),
            end=this.round( arr[len-1], classSize )+classSize;
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
}
var SetTool=new function(){
    this.uSet=[];   //union
    this.iSet=[];   //pairwise intersection
    this.iSet_all=[];//common to every set
    this.arrFormat=function( len, val ){
        var out = [];
        while( len-- ){
            out.push(val);
        }
        return out;
    }
    this.arrFormat_2d=function( len1, len2, val ){
        var out = [],i,j;
        for( i=0;i<len1; i++ ){
            out.push( [] );
            for( j=0;j<len2; j++ ){
                out[i].push( val );
            }
        }
        return out;
    }
    this.arrTo1d=function( arr ){
        var i, j, out=[];
        for( i=0;i<arr.length; i++ ){
            for( j=0;j<arr[i].length; j++ ){
                out.push( arr[i][j] );
            }
        }
        return out;
    }
    this.arrToSet=function( arr ){
        /* For 1-d array; assume sorted, len>0 
         * Returns 1-d array, no duplicates */
        var out=[arr[0]];
        for( var i=1;i<arr.length; i++ ){
            if(  arr[i-1]!==arr[i] ){
                out.push( arr[i] );
            }
        }
        return out;
    }
    this.setUnion_1d=function( arr ){//assume 1-d numeric, not sorted
        Stat.numSort( arr );
        return ( this.uSet=this.arrToSet( arr ) );
    }
    this.setUnion_2d=function( arr ){//assume twoD sub-arrays are sorted, array len>1
        var i, len=arr.length, besti, min;
        var curr, last=Number.MIN_SAFE_INTEGER, ix=this.arrFormat( len, 0 );
        this.uSet=[];
        do{
            min=Number.MAX_SAFE_INTEGER;
            besti=false;
            for( i=0;i<len; i++ ){//vertical min
                curr=arr[i].elem( ix[i] );
                if( curr!==false && curr<min ){
                    besti=i;
                    min=curr;
                }
            }
            if( besti===false ){break;}   //all subarrays have been checked
            if( min>last ){                 //min>last keeps elements unique
                last=min;
                this.uSet.push( min );
            }
            ix[besti]++;
        }while( true );
        return this.uSet;
    }
    
    this.formatIObj=function( a, b, obj ){
        if( a<b ){
            return ( a<b )? {i1: a, i2: b, list: []} : {i1: b, i2: a, list: []};
        }
        return ( a<b )? {i1: a, i2: b, list: []} : {i1: b, i2: a, list: []};
    }
    this.genFieldName=function( a, b ){
        return ( a<b )? a+'_'+b : b+'_'+a;
    }
    this.intersect=function( arr ){//assume twoD sub-arrays are sorted, array len>1
        var i, len=arr.length, min, besti, lastBesti, field;
        var curr, last=Number.MIN_SAFE_INTEGER, ix=this.arrFormat( len, 0 );
        var iSet={};
        do{
            min=Number.MAX_SAFE_INTEGER;
            besti=false;
            for( i=0;i<len; i++ ){//vertical min
                curr=arr[i].elem( ix[i] );
                if( curr!==false && curr<min ){
                    besti=i;
                    min=curr;
                }
            }
            if( besti===false ){break;}   //all subarrays have been checked
            if( min==last ){                 //min>last keeps elements unique
                field=this.genFieldName( besti, lastBesti );
                if( !iSet.hasOwnProperty( field ) ){
                    iSet[field]=this.formatIObj( besti, lastBesti );
                }
                iSet[field].list.push( min );
            }
            last=min;
            lastBesti=besti
            ix[besti]++;
        }while( true );
        return iSet; 
    }
    this.intersect_1d=function( a, b ){
        var out=[], ai=0, bi=0, acurr, bcurr, last=Number.MIN_SAFE_INTEGER;
        while( ( acurr=a[ai] )!==undefined && ( bcurr=b[bi] )!==undefined ){
            if( acurr < bcurr){
                if( last===acurr ){
                    out.push( acurr );
                }
                last=acurr;
                ai++;
            }
            else if( acurr > bcurr){
                if( last===bcurr ){
                    out.push( bcurr );
                }
                last=bcurr;
                bi++;
            }
            else {
                out.push( acurr );
                last=acurr;
                ai++;
                bi++;
            }
        }
        return out;
    }
    this.intersect_2d=function( arr ){
        var i, j, curr, len=arr.length, iSet={};
        for( i=0;i<len; i++ ){
            for( j=0;j<len; j++ ){
                if( i==j ){continue;}
                curr=this.intersect_1d( arr[i], arr[j] );
                if( curr.length ){
                    if( i<j ){
                        iSet[ i+'^'+j ]={i1: i, i2: j, list: curr};
                    }
                    else{
                        iSet[ j+'^'+i ]={i1: j, i2: i, list: curr};
                    }
                }
            }
        }
        return iSet;
    }
    this.setIntersect=function( arr ){
        this.iSet=this.intersect_2d( arr );
        return this.iSet;
    }
    this.dispIntersect=function( id ){
        var dl=Widget.getDL();
        for(var field in this.iSet ){
            Widget.addKeyVal_dl( dl, field, this.iSet[field].list.join(' ') );
        }
        var elem=document.getElementById( id );
        elem.innerHTML='';
        elem.appendChild( dl );
    }
}
var Discr=new function(){
    /* run-then-display functions */
    this.dist_b=function(){
        var a=Getter.getRange( 'ia' ), 
            b=Getter.getInt( 'ib' ), 
            c=Getter.get0to1( 'ic' );
        if( Err.disp() ){ return; }
        if( a[1]>b ){
            Err.alert( 'Input error: Portion greater than whole: '+a[1]+', '+b );
            return;
        }
        var result=Discr.binom_range( a[0], a[1], b, c );
        document.getElementById('pop_b_a').innerHTML=
            ( a[0]===a[1] )? a[0] : 'From '+a[0]+' to '+a[1];
        document.getElementById('pop_b_b').innerHTML=b;
        document.getElementById('pop_b_c').innerHTML=c;
        document.getElementById('pop_b_r').innerHTML=result;
        popOpen('pop_b');
    }
    this.dist_h=function(){
        var a=Getter.getRange( 'ia' ), 
            b=Getter.getInt( 'ib' ), 
            c=Getter.getInt( 'ic' ),
            d=Getter.getInt( 'id' );
        if( Err.disp() ){ return; }
        if( a[1]>b ){
            Err.alert( 'Input error: Portion greater than whole: '+a[1]+', '+b );
            return;
        }
        if( c>d ){
            Err.alert( 'Input error: Portion greater than whole: '+c+', '+d );
            return;
        }
        if( b>d ){
            Err.alert( 'Input error: Portion greater than whole: '+b+', '+d );
            return;
        }
        var r1=Discr.hypGeo_range_fraction( a[0], a[1], b, c, d ), 
            r2=Discr.hypGeo_range( a[0], a[1], b, c, d )
        document.getElementById('pop_h_a').innerHTML=
            ( a[0]===a[1] )? a[0] : 'From '+a[0]+' to '+a[1];
        document.getElementById('pop_h_b').innerHTML=b;
        document.getElementById('pop_h_c').innerHTML=c;
        document.getElementById('pop_h_d').innerHTML=d;
        document.getElementById('pop_h_r1').innerHTML=r1;
        document.getElementById('pop_h_r2').innerHTML=+r2;
        popOpen('pop_h');
    }
    this.dist_p=function(){
        var a=Getter.getRange( 'ia' ), 
            b=Getter.getFloat( 'ib' );
        if( Err.disp() ){ return; }
        var result=Discr.poisson_range( a[0], a[1], b );
        document.getElementById('pop_p_a').innerHTML=
            ( a[0]===a[1] )? a[0] : 'From '+a[0]+' to '+a[1];
        document.getElementById('pop_p_b').innerHTML=b;
        document.getElementById('pop_p_r').innerHTML=result;        
        popOpen('pop_p');
    } 
    this.dist_n=function(){
        var a=Getter.getInt( 'ia' ), 
            b=Getter.getInt( 'ib' ),
            c=Getter.get0to1( 'ic' );
        if( Err.disp() ){ return; }
        var result=Discr.negBin( a, b, c );
        document.getElementById('pop_n_a').innerHTML=a;
        document.getElementById('pop_n_b').innerHTML=b;
        document.getElementById('pop_n_c').innerHTML=b;
        document.getElementById('pop_n_r').innerHTML=result;        
        popOpen('pop_n');
    }     
    /* Statistics distributions */
    this.fac=function( n ){
        if( n<2 ){return 1;}
        for( var i=n-1;i>1;i-- ){
            n *= i;
        }
        return n;
    }
    this.ordered=function( n, k ){//permutations
        var nmink=n-k;
        if( k<0 || nmink<0 ){
            document.write('<br>Error: n choose k: n='+n+', k='+k+'<br>');
            return 1;
        }
        if( k==0 ){
            return 1;
        }
        for( var i=n-1;i>nmink;i-- ){
            n *= i;
        }
        return n;
    } 
    this.unordered=function( n, k ){//combinations
        /* There are (n choose k) ways to choose k elements 
         * from a set of n elements. See Combination.*/
        return this.ordered( n, k )/this.fac( k );
    }
    this.binom=function( x, n, p ){
        /* n is sample size
         * p is probability p(X)
         * x is number of successes; 
         * returns probability of x successes, given sample size and probability */
        var nCx=this.unordered( n, x );
        var succ=Math.pow( p, x );
        var fail=Math.pow( 1-p, n-x );
        return nCx*succ*fail;
    }
    this.binom_range=function( lo, hi, n, p ){//range is inclusive
        var sum=0;
        while( lo<=hi ){
            sum+=this.binom( lo++, n, p );
        }
        return sum;
    }
    
    this.hypGeo_range_fraction=function( lo, hi, n, M, N ){//range is inclusive
        var all=this.unordered( N, n );
        var sum=0;
        while( lo<=hi ){
            sum+=( this.unordered( M, lo )*this.unordered( N-M, n-lo ) );
            lo++;
        }
        return '('+sum+')/('+all+')';//returns a fraction, not decimal
    }
    this.hypGeo_fraction=function( x, n, M, N ){
        var succ=this.unordered( M, x );
        var fail=this.unordered( N-M, n-x );
        var all=this.unordered( N, n );
        return '('+(succ*fail).toString()+')/('+all.toString()+')';//returns a fraction, not decimal
    }
    this.hypGeo_range=function( lo, hi, n, M, N ){//range is inclusive
        var sum=0;
        while( lo<=hi ){
            sum+=this.hypGeo( lo++, n, M, N );
        }
        return sum;
    }
    this.hypGeo=function( x, n, M, N ){
        /* n is sample size
         * M is number of successes in population
         * N is size of popultation
         * x is number of successes in sample; 
         * returns probability of x successes, given n, M, N */
        var succ=this.unordered( M, x );
        var fail=this.unordered( N-M, n-x );
        var all=this.unordered( N, n );
        return ( succ*fail )/all;
    }
    this.hypGeo_expected=function( n, M, N ){
        return n*(M/N);
    }
    this.hypGeo_var=function( n, M, N ){
        /* (M/N) is expected value 
         * 1-M/N is complement of expected value */
        return n*(M/N)*(1-M/N)*(N-n)/(N-1);
    }
    this.poisson=function( x, lam ){
        /* lam is E(X), the expected value of X, the population mean 
         * x is number of successes; 
         * returns probability of x successes, given expected value of X */
        return ( Math.pow( Math.E, ( lam*-1 ) ) * Math.pow( lam, x ) )/this.fac( x );
    }
    this.poisson_range=function( lo, hi, lam ){//range is inclusive
        var sum=0;
        while( lo<=hi ){
            sum+=this.poisson( lo++, lam );

        }
        return sum;
    }
    this.negBin=function( x, r, p ){
        /* x is number of successes desired
         * r is number of failures before x successes 
         * x + r is the total number of trials
         * p is probability 
         * returns probability of x successes, given r failures and probability p */
        return this.unordered( x+r-1, r-1 )*Math.pow( p, r )*Math.pow( (1-p), x );
    }
    /* Random algos */
    this.multiset=function( n, k ){
        /* There are (n+k-1 choose k) ways to choose k elements 
         * from a set of n elements if repetitions are allowed.*/
        return this.unordered( n+k-1, k );
    }
    this.binaryString=function( n, k ){
        /* There are (n+k choose k) strings containing k ones and n zeros.*/
        return this.unordered( n+k, k );
    }
    this.binaryString_noAdj=function( n, k ){
        /* There are (n+1 choose k) strings consisting of k ones and n zeros 
         * such that no two ones are adjacent*/
        return this.unordered( n+1, k );
    }
}
/* Handlers */
function handleSets(){
    var text=document.getElementById('textIn').value;
    var i, obj, a2;
    a2=Getter.textToArr( text );//text to 1-d array
    if( !a2.length ){
        Err.alert('Input Error: Empty')
        return;
    }
    a2=Getter.arrSplitOnChar( a2 );//now a 2-d array
    for( i=0;i<a2.length; i++ ){//make sure only num and dot are in array
        Getter.arrToNumArr( a2[i] );
    }
    if( Err.disp() ){ return; }
    /* Handle original 2-d array */
    Widget.arrToHTML_2d( a2, 'orig');//display original, with duplicates
    
    /* Handle 1-d array with duplicates */
    var a1=SetTool.arrTo1d( a2 );//turn orig to 1-d array, keep duplicates
    Stat.numSort( a1 );
    Widget.arrToHTML( a1, 'sorted');//display original as 1d sorted
    obj=Stat.spreadToObj( a1 );//
    Stat.dispAttr( obj, 'iattr', 3 );
    Stat.dispOutliers( obj, 'iout' );
    
    /* Handle 1-d union array */
    var uSet=SetTool.arrToSet( a1 );
    Widget.arrToHTML( uSet, 'union' );//display union set as 1d sorted
    obj=Stat.spreadToObj( uSet );
    Stat.dispAttr( obj, 'uattr', 3 );
    Stat.dispOutliers( obj, 'uout' );
    /* Handle intersections in 2-d array */
    for( i=0;i<a2.length; i++ ){//sort each subarray
        Stat.numSort( a2[i] );
        a2[i]=SetTool.arrToSet( a2[i] );
    }
    SetTool.setIntersect( a2 );
    SetTool.dispIntersect( 'intersect' );
    Histo.basicHist( obj.trimmed );
    popOpen('pop_set')
}
function multiIn( type ){
    /* Labels */
    var a=document.getElementById('ia_label'),
        b=document.getElementById('ib_label'),
        c=document.getElementById('ic_label');
    /* Clues */
    var ia_clue=document.getElementById('ia_clue'),
        ib_clue=document.getElementById('ib_clue'),
        ic_clue=document.getElementById('ic_clue');  
    if( type=='b' ){
        $('#ic_col').show();
        $('#id_col').hide();
        a.innerHTML='X';
        b.innerHTML='Sample Size';
        c.innerHTML='Probability';
        ia_clue.innerHTML='Value/Range';
        ib_clue.innerHTML='Value';
        ic_clue.innerHTML='0 to 1';
        NEXT_DIST=Discr.dist_b;
    }
    else if( type=='h' ){
        $('#ic_col').show();
        $('#id_col').show();
        a.innerHTML='Success';
        b.innerHTML='Sample Size';
        c.innerHTML='Pop. Success';
        ia_clue.innerHTML='Value';
        ib_clue.innerHTML='Value';
        ic_clue.innerHTML='Value';
        NEXT_DIST=Discr.dist_h;
    }
    else if( type=='p' ){
        $('#ic_col').hide();
        $('#id_col').hide();
        a.innerHTML='X';
        b.innerHTML='Lambda';
        ia_clue.innerHTML='Value/Range';
        ib_clue.innerHTML='E(X)';
        NEXT_DIST=Discr.dist_p;
    }
    else if( type=='n' ){
        $('#ic_col').show();
        $('#id_col').hide();
        a.innerHTML='Successes';
        b.innerHTML='Failures';
        c.innerHTML='Probability';
        ia_clue.innerHTML='Value';
        ib_clue.innerHTML='Value';
        ic_clue.innerHTML='0 to 1';
        NEXT_DIST=Discr.dist_n;
    }
}
/* Leftovers */
function covar( obj ){
    /* call like this: obj is associative 2-d array. Or use 2-d array
        var obj={
            0:{0:0.02, 5:0.06, 10:0.02, 15:0.10},
            5:{0:0.04, 5:0.17, 10:0.20, 15:0.10},
            10:{0:0.01, 5:0.15, 10:0.12, 15:0.01}
        }
        p=covar( obj  );
     **/
    var Exy=Hx( obj,expectedXY );//x*y*f(x,y)
    var Ex=Hx( obj,expectedX );//x*f(x,y)
    var Ey=Hx( obj,expectedY );//y*f(x,y)
    return Exy-(Ex*Ey);
}
function corrCoeff( obj ){//returns rho // doublecheck algo; doesn't work'
    var Vx=Math.sqrt( Hx( obj, expectedXsq ) );
    var Vy=Math.sqrt( Hx( obj, expectedYsq ) );
    var covXY= covar( obj );
    document.write( 'V(x)='+Vx+'<br>')
    document.write( 'V(y)='+Vy+'<br>') 
    document.write( 'covar(xy)='+covXY+'<br>') 
    return covXY/( Vx*Vy );
}
function calculus(){
    this.polyToStr=function( consts, pStart ){
        /* Convert array form to readable polynomial form */
        var p=(arguments.length==4)? pStart : 0;
        var out,log_in=[], x, tween;
        for( var i=0;i<consts.length;i++, p++ ){
            if( consts[i] ){
                if( i ){
                    tween=( consts[i]>0 )? ' + ' : ' - '
                }
                else{
                    tween='';
                }
                if( p ){
                    x=( p===1 )? 'x' : 'x^'+p;
                }
                else{
                    x='';
                }
                log_in.push( tween + Math.abs( consts[i] ).toString() + x );
            }
        }
        out=log_in.join('');
        return out;
    }
    this.iPow=function( c, x, p ){//sub-function for integrate
        p++;
        if(p===1){//p was 0
            return c*x;
        }
        if(p===0){//p was -1
            if( x<0 ){
                console.log('Error: 1/x is ln(x): undefined')
                return 0;
            }
            return c*Math.log(x);
        }
        return (c/p)*Math.pow( x, p )
    }
    this.integrate=function( consts, a, b, pStart ){
        /* Integrate simple polynomials like 3 - 10x^1 + 2x^3
         * pass array [3, -10, 0, 2 ]
         * powers are consecutive 0, 1, 2...
         * use zero as placeholder for unused power 
         * pass pStart for power other than zero: -2, -1, 0...
         * Remember: 1/x is ln(x): no negative number for a or b */
        var p=(arguments.length==4)? pStart : 0;
        document.write( this.polyToString( consts, p )+'<br>') 
        var sum=0;
        for( var i=0;i<consts.length;i++, p++ ){
            sum+=this.iPow( consts[i], b, p );
            sum-=this.iPow( consts[i], a, p );
        }
        return sum;
    }
}

