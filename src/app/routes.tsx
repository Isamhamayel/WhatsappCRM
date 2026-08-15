import { createHashRouter } from "react-router";
import { LoginPage } from "./components/LoginPage";
import { MainLayout } from "./components/MainLayout";
import { Dashboard } from "./components/Dashboard";
import { SharedInbox } from "./components/SharedInbox";
import { LeadsManagement } from "./components/LeadsManagement";
import { LeadDetail } from "./components/LeadDetail";
import { TicketSystem } from "./components/TicketSystem";
import { TicketDetail } from "./components/TicketDetail";
import { Campaigns } from "./components/Campaigns";
import { CampaignCreate } from "./components/CampaignCreate";
import { CampaignAnalytics } from "./components/CampaignAnalytics";
import { Contacts } from "./components/Contacts";
import { ContactDetail } from "./components/ContactDetail";
import { UsersDepartments } from "./components/UsersDepartments";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { Audiences } from "./components/Audiences";
import { AudienceCreate } from "./components/AudienceCreate";
import { AuditTrail } from "./components/AuditTrail";
import { WhatsAppAccounts } from "./components/WhatsAppAccounts";
import { PlatformAdmin } from "./components/PlatformAdmin";
import { RequireAuth } from "../auth/RequireAuth";

export const router = createHashRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "inbox",
        element: <SharedInbox />,
      },
      {
        path: "leads",
        element: <LeadsManagement />,
      },
      {
        path: "leads/:id",
        element: <LeadDetail />,
      },
      {
        path: "tickets",
        element: <TicketSystem />,
      },
      {
        path: "tickets/:id",
        element: <TicketDetail />,
      },
      {
        path: "campaigns",
        element: <Campaigns />,
      },
      {
        path: "campaigns/create",
        element: <CampaignCreate />,
      },
      {
        path: "campaigns/:id/analytics",
        element: <CampaignAnalytics />,
      },
      {
        path: "contacts",
        element: <Contacts />,
      },
      {
        path: "contacts/:id",
        element: <ContactDetail />,
      },
      {
        path: "users",
        element: <UsersDepartments />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "whatsapp-accounts",
        element: <WhatsAppAccounts />,
      },
      {
        path: "platform",
        element: <PlatformAdmin />,
      },
      {
        path: "audit-trail",
        element: <AuditTrail />,
      },
      {
        path: "audiences",
        element: <Audiences />,
      },
      {
        path: "audiences/create",
        element: <AudienceCreate />,
      },
      {
        path: "audiences/:id",
        element: <Contacts />,
      },
      {
        path: "audiences/:id/edit",
        element: <AudienceCreate />,
      },
    ],
  },
]);
