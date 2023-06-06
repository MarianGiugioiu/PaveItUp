import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspaceComponent } from './workspace/workspace.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './account/login/login.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'workspace/:id', component: WorkspaceComponent },
  { path: 'account/register', component: LoginComponent },
  { path: 'account/login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
