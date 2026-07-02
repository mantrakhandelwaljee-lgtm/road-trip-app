#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <cmath>
#include <map>
#include <unordered_set>

typedef long long ll ;
 
using namespace std;

bool solve(){
    ll x , y ; cin >> x >> y ;

    if(x%y != 0){
        return false ;
    }

    ll z = x/y ;
    if(!sqrt(z)){
        return false ;
    }
    return true ;
}

 int main(){

	ios_base::sync_with_stdio(false);
    cin.tie(NULL);

	ll t ; 
	cin >> t ;

	while(t--){
		
		if(solve()){
            cout << "YES\n" ;
        }else{
            cout << "NO\n" ;
        }
        
	}

	return 0 ;
}




// round , ceil , floor , fmax , fmin , cmath , cin , getline , void , if , else , && , || , switch , case 
// break , default , while() , for() , isaplha , isnumber , isalnum , isblank , islower , isuppercase