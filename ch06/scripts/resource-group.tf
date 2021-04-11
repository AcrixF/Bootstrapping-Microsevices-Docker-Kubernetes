resource "azurerm_resource_group" "tubeflix" {
  name = var.app_name
  location = var.location
}