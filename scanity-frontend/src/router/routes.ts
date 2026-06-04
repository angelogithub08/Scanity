import type { RouteRecordRaw } from 'vue-router';

import LoginPage from 'pages/auth/LoginPage.vue';
import RegisterPage from 'pages/auth/RegisterPage.vue';
import ForgotPassword from 'pages/auth/ForgotPassword.vue';
import DefineNewPassword from 'pages/auth/DefineNewPassword.vue';
import ErrorNotFound from 'pages/ErrorNotFound.vue';

import UsersListPage from 'pages/users/UsersListPage.vue';
import UserRecordPage from 'pages/users/UserRecordPage.vue';
import UserDataPage from 'pages/users/UserDataPage.vue';
import CustomersListPage from 'pages/customers/CustomersListPage.vue';
import CustomerRecordPage from 'pages/customers/CustomerRecordPage.vue';
import TokensListPage from 'pages/tokens/TokensListPage.vue';
import TokenRecordPage from 'pages/tokens/TokenRecordPage.vue';
import ProductsListPage from 'pages/products/ProductsListPage.vue';
import ProductRecordPage from 'pages/products/ProductRecordPage.vue';

import LogsListPage from 'pages/logs/LogsListPage.vue';
import AdminUsersListPage from 'pages/users/AdminUsersListPage.vue';
import AdminUserRecordPage from 'pages/users/AdminUserRecordPage.vue';
import SupliersListPage from 'src/pages/supliers/SupliersListPage.vue';
import SuplierRecordPage from 'src/pages/supliers/SuplierRecordPage.vue';
import CategoriesListPage from 'src/pages/categories/CategoriesListPage.vue';
import CategoryRecordPage from 'src/pages/categories/CategoryRecordPage.vue';
import StocksListPage from 'src/pages/stocks/StocksListPage.vue';
import StockRecordPage from 'src/pages/stocks/StockRecordPage.vue';
import StockProductsReportPage from 'src/pages/reports/StockProductsReportPage.vue';
import StockBelowMinimumReportPage from 'src/pages/reports/StockBelowMinimumReportPage.vue';
import StockMovementsReportPage from 'src/pages/reports/StockMovementsReportPage.vue';
import MostMovedProductsReportPage from 'src/pages/reports/MostMovedProductsReportPage.vue';
import InventoryCountsListPage from 'src/pages/inventory-counts/InventoryCountsListPage.vue';
import InventoryCountRecordPage from 'src/pages/inventory-counts/InventoryCountRecordPage.vue';
import ProfilesListPage from 'src/pages/profiles/ProfilesListPage.vue';
import ProfileRecordPage from 'src/pages/profiles/ProfileRecordPage.vue';
import PermissionsListPage from 'src/pages/permissions/PermissionsListPage.vue';
import PermissionRecordPage from 'src/pages/permissions/PermissionRecordPage.vue';
import MovementStagesListPage from 'src/pages/movement-stages/MovementStagesListPage.vue';
import MovementStageRecordPage from 'src/pages/movement-stages/MovementStageRecordPage.vue';
import MainDashboard from 'src/pages/dashboards/MainDashboard.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Dashboard (página inicial, sem permissão)
      { path: '', name: 'main-dashboard', component: MainDashboard },

      // Users
      { path: 'usuarios', name: 'users', component: UsersListPage },
      { path: 'usuario/:id?', name: 'user', component: UserRecordPage },
      { path: 'meus-dados', name: 'user-data', component: UserDataPage },

      // Customers
      { path: 'clientes', name: 'customers', component: CustomersListPage },
      { path: 'cliente/:id?', name: 'customer', component: CustomerRecordPage },

      // Tokens
      { path: 'tokens', name: 'tokens', component: TokensListPage },
      { path: 'token/:id?', name: 'token', component: TokenRecordPage },

      // Products
      { path: 'produtos', name: 'products', component: ProductsListPage },
      { path: 'produto/:id?', name: 'product', component: ProductRecordPage },

      // Stocks
      { path: 'estoque', name: 'stocks', component: StocksListPage },
      { path: 'estoque/:id?', name: 'stock', component: StockRecordPage },

      // Movement Stages
      { path: 'estagios-de-movimento', name: 'movement-stages', component: MovementStagesListPage },
      {
        path: 'estagio-de-movimento/:id?',
        name: 'movement-stage',
        component: MovementStageRecordPage,
      },

      // Inventory Counts
      {
        path: 'contagem-de-inventario',
        name: 'inventory-counts',
        component: InventoryCountsListPage,
      },
      {
        path: 'contagem-de-inventario/:id?',
        name: 'inventory-count',
        component: InventoryCountRecordPage,
      },

      // Supliers
      { path: 'fornecedores', name: 'supliers', component: SupliersListPage },
      { path: 'fornecedor/:id?', name: 'suplier', component: SuplierRecordPage },

      // Categories
      { path: 'categorias', name: 'categories', component: CategoriesListPage },
      { path: 'categoria/:id?', name: 'category', component: CategoryRecordPage },

      // Reports
      {
        path: 'relatorios/produtos-em-estoque',
        name: 'report-stock-products',
        component: StockProductsReportPage,
      },
      {
        path: 'relatorios/produtos-abaixo-estoque-minimo',
        name: 'report-stock-below-minimum',
        component: StockBelowMinimumReportPage,
      },
      {
        path: 'relatorios/movimentacoes-estoque',
        name: 'report-stock-movements',
        component: StockMovementsReportPage,
      },
      {
        path: 'relatorios/produtos-mais-movimentados',
        name: 'report-most-moved-products',
        component: MostMovedProductsReportPage,
      },

      // Profiles
      { path: 'perfis', name: 'profiles', component: ProfilesListPage },
      { path: 'perfil/:id?', name: 'profile', component: ProfileRecordPage },
    ],
  },

  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login', component: LoginPage },
      { path: 'criar-conta', name: 'register', component: RegisterPage },
      {
        path: 'esqueceu-a-senha',
        name: 'forgot-password',
        component: ForgotPassword,
      },
      {
        path: 'redefinir-senha',
        name: 'define-new-password',
        component: DefineNewPassword,
      },
    ],
  },

  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    children: [
      { path: 'logs', name: 'admin-logs', component: LogsListPage },
      { path: 'usuarios', name: 'admin-users', component: AdminUsersListPage },
      { path: 'usuario/:id?', name: 'admin-user', component: AdminUserRecordPage },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound,
  },
];

export default routes;
