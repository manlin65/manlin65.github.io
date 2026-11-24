unit Bestandsreservierung;

interface

type
  TInventory = class
  private
    FStock: Integer;
    FReserved: Integer;
    function GetAvailable: Integer;
  public
    constructor Create(InitialStock: Integer);
    function TryReserve(Quantity: Integer): Boolean;
    function TryRelease(Quantity: Integer): Boolean;
    property Available: Integer read GetAvailable;
    property Reserved: Integer read FReserved;
  end;

implementation

constructor TInventory.Create(InitialStock: Integer);
begin
  inherited Create;
  if InitialStock > 0 then
    FStock := InitialStock
  else
    FStock := 0;
  FReserved := 0;
end;

function TInventory.GetAvailable: Integer;
begin
  Result := FStock - FReserved;
end;

function TInventory.TryReserve(Quantity: Integer): Boolean;
begin
  Result := (Quantity > 0) and (Quantity <= Available);
  if Result then
    Inc(FReserved, Quantity);
end;

function TInventory.TryRelease(Quantity: Integer): Boolean;
begin
  Result := (Quantity > 0) and (Quantity <= FReserved);
  if Result then
    Dec(FReserved, Quantity);
end;

end.
