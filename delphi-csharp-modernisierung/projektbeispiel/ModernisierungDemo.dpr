program ModernisierungDemo;

{$APPTYPE CONSOLE}

uses
  Rabatt in 'Quellen\Rabatt.pas',
  Versandklasse in 'Quellen\Versandklasse.pas',
  Messwertanalyse in 'Quellen\Messwertanalyse.pas';

begin
  WriteLn(DiscountPercent(100));
  WriteLn(ShippingClass(501));
  WriteLn(LongestAlarmRun([1, 4, 5, 0, 6], 4));
end.
