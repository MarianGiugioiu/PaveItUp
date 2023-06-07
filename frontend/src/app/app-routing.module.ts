import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspaceComponent } from './workspace/workspace.component';
import { WorkspacesComponent } from './workspaces/workspaces.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { ValidateEmailComponent } from './account/validate-email/validate-email.component';
import { ForgotPasswordComponent } from './account/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './account/reset-password/reset-password.component';
import { HomeComponent } from './home/home.component';
import { DetailsComponent } from './account/details/details.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'workspaces', component: WorkspacesComponent },
  { path: 'workspace/:id', component: WorkspaceComponent },
  { path: 'account/register', component: RegisterComponent },
  { path: 'account/details', component: DetailsComponent },
  { path: 'account/login', component: LoginComponent },
  { path: 'account/forgot-password', component: ForgotPasswordComponent },
  { path: 'account/validate-email/:code', component: ValidateEmailComponent },
  { path: 'account/reset-password/:code', component: ResetPasswordComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
