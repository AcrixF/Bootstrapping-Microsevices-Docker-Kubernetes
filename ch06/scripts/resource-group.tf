resource "azurerm_resource_group" "kubia" {
  name = var.app_name
  location = var.location
}