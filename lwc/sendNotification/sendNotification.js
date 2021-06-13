import { LightningElement, track } from 'lwc';
import serachAccs from '@salesforce/apex/SearchUser.retriveAccs';
import sendNotifications from '@salesforce/apex/SearchUser.sendNotifications';
// datatable columns
const columns = [
    {
        label: 'Name',
        fieldName: 'Name',
        type: 'text'
    },
    
    {
        label: 'Username',
        fieldName: 'Username',
    },
];
export default class CustomSearchInLWC extends LightningElement {
    @track searchData;
    @track columns = columns;
    @track errorMsg = '';
    strSearchAccName = '';
    @track body = '';
    @track senderId= '';
    @track link= '';
    @track userId= '';

    handleAccountName(event) {
        this.strSearchAccName = event.detail.value;
    }

    handleBody(event) {

        this.body = event.detail.value;
    }

    handleLink(event) {
        this.link = event.detail.value;
    }

    handleSearch() {
        
        if(!this.strSearchAccName) {
            this.errorMsg = 'Please enter User name to search.';
            this.searchData = undefined;
            return;
        }
        
        if(!this.body) {
            this.errorMsg = 'Please enter comment to search.';
            this.body = undefined;
            return;
        }

        if(!this.link) {
            this.errorMsg = 'Please enter link to search.';
            this.link = undefined;
            return;
        }

        serachAccs({strAccName : this.strSearchAccName})
            .then(result => {

                this.searchData = result;
            })
          
        .catch(error => {
            this.searchData = undefined;
            alert('okold'+JSON.stringify(error));
            window.console.log('error =====> '+JSON.stringify(error));
            if(error) {
                this.errorMsg = error.body.message;
            }
        }) 


    }


    getSelectedName(event) {
        const selectedRows = event.detail.selectedRows;
        
        for (let i = 0; i < selectedRows.length; i++){
            this.userId = selectedRows[i].Id;
        }
        


        sendNotifications({strBody : this.body, strSenderId : '', strTargetId :this.link, strTitle : 'Handle customer', setUserIds : this.userId})
            .then(result => {
            })
          
        .catch(error => {
            this.searchData = undefined;
            alert('ok5'+JSON.stringify(error));
            window.console.log('error =====> '+JSON.stringify(error));
            if(error) {
                this.errorMsg = error.body.message;
            }
        }) 
    }

}