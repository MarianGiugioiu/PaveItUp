import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GenerateLineComponent } from './generate-line/generate-line.component';
import { FormsModule } from '@angular/forms';
import { WorkspaceComponent } from './workspace/workspace.component';
import { PlaceShapesComponent } from './place-shapes/place-shapes.component';
import { EditPartComponent } from './edit-part/edit-part.component';
import { HomeComponent } from './home/home.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxSpinnerModule } from "ngx-spinner";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgSelectModule } from '@ng-select/ng-select';
import { InfoPopupComponent } from './info-popup/info-popup.component';
import { HttpClientModule } from '@angular/common/http';
import { LastElementInViewDirective } from './common/directives/last-element-in-view.directive';

@NgModule({
  declarations: [
    AppComponent,
    GenerateLineComponent,
    PlaceShapesComponent,
    WorkspaceComponent,
    EditPartComponent,
    HomeComponent,
    InfoPopupComponent,
    LastElementInViewDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgSelectModule,
    ColorPickerModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' })
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
