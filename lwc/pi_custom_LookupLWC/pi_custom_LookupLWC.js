import { LightningElement, track, wire, api } from "lwc";
import findRecords from "@salesforce/apex/LwcLookupController.findRecords";

export default class Pi_custom_LookupLWC extends LightningElement {

  @track recordsList;
  @track searchKey = "";
  @track selectedValue = '';
  @api selectedRecordId;
  @api objectApiName;
  @api iconName;
  @api lookupLabel;
  @track message;

  //added by vivek
  @api cityLabel;
  @api fieldLabel;

  onLeave(event) {
    setTimeout(() => {
      this.searchKey = "";
      this.recordsList = null;
    }, 300);
  }

  onRecordSelection(event) {
    this.selectedRecordId = event.target.dataset.key;
    this.selectedValue = event.target.dataset.name;
    this.searchKey = "";
    this.onSeletedRecordUpdate();
  }

  //added by vivek on 02-Feb-21
  @api getFiredFromAura(areaName, areaMasterId) {
    console.log('from aura' + areaName);
    console.log('from aura' + areaMasterId);
    this.selectedValue = areaName;
    this.selectedRecordId = areaMasterId;
    // this.searchKey = "";
    this.onSeletedRecordUpdate();
  }

  handleKeyChange(event) {
    const searchKey = event.target.value;
    this.searchKey = searchKey;
    this.getLookupResult();
  }

  removeRecordOnLookup(event) {
    this.searchKey = "";
    this.selectedValue = null;
    this.selectedRecordId = null;
    this.recordsList = null;
    this.onSeletedRecordUpdate();
  }
  getLookupResult() {
    if (this.searchKey.length > 0) {
      findRecords({ searchKey: this.searchKey, objectName: this.objectApiName, cityInput: this.cityLabel })
        .then((result) => {
          console.log('::' + JSON.stringify(result));
          if (result.length === 0) {
            this.recordsList = [];
            this.message = "No Records Found";
          } else {
            this.recordsList = result;
            this.message = "";
          }
          this.error = undefined;
        })
        .catch((error) => {
          this.error = error;
          this.recordsList = undefined;
        });
    }

  }

  onSeletedRecordUpdate() {
    const passEventr = new CustomEvent('recordselection', {
      detail: { selectedRecordId: this.selectedRecordId, selectedValue: this.selectedValue }
    });
    this.dispatchEvent(passEventr);
  }
}