import { LightningElement, wire, track , api} from 'lwc';
import getArticles from '@salesforce/apex/KBArticles.getArticles';
import { NavigationMixin } from 'lightning/navigation';

export default class KBArticleDisplay extends NavigationMixin(LightningElement) {
    title ='';
    @api recordId;
    @track articleList =[];
    @track selectedCheck;
    @wire(getArticles,{searchKey:'$recordId',
    search:'$title'
})
    retrieveArticle({error,data}){
        if(data){
            this.articleList = data;
        }
        else if(error){

        }
    }

    handleKeyChange(event){
        this.title = event.target.value;
    }

    handleCheckBoxChange(event){
        debugger;
        this.selectedCheck = event.currentTarget.getAttribute("data-index");
        //  window.console.log('test'+ selectedCheck);
      // alert('Selected id'+ this.selectedCheck);
       this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: this.selectedCheck,
            objectApiName: 'Knowledge__kav',
            actionName: 'view'
        }
    });
    }


}