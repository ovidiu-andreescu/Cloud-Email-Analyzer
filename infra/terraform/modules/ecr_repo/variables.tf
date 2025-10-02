variable "name" {
  type = string
}

variable "image_mutability" {
  type = string
  default = "MUTABLE"
} # or IMMUTABLE

variable "scan_on_push" {
  type = bool
  default = true
}

variable "tags" {
  type = map(string)
  default = {}
}
